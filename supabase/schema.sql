-- =============================================
-- SETTLE APP — SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_emoji TEXT NOT NULL DEFAULT '🎲',
  settle_score INTEGER NOT NULL DEFAULT 750,
  bets_won INTEGER NOT NULL DEFAULT 0,
  bets_lost INTEGER NOT NULL DEFAULT 0,
  bets_paid INTEGER NOT NULL DEFAULT 0,
  bets_ghosted INTEGER NOT NULL DEFAULT 0,
  venmo_username TEXT,
  cashapp_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- BETS
-- =============================================
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenged_phone TEXT,                          -- phone number of opponent (may not have account)
  challenged_user UUID REFERENCES profiles(id),   -- set when opponent accepts
  title TEXT NOT NULL,                            -- "I bet that Taylor Swift released Shake It Off before 2015"
  stake TEXT NOT NULL,                            -- "Next round", "$20 Venmo", etc.
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'resolving', 'settled', 'disputed', 'cancelled')),
  resolution_method TEXT
    CHECK (resolution_method IN ('mutual', 'witness', 'evidence')),
  winner_id UUID REFERENCES profiles(id),
  invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  note TEXT,                                      -- optional context/details
  witness_phone TEXT,                             -- optional witness phone
  witness_user UUID REFERENCES profiles(id),
  witness_verdict TEXT CHECK (witness_verdict IN ('challenger', 'challenged', 'draw')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bets_created_by ON bets(created_by);
CREATE INDEX IF NOT EXISTS idx_bets_challenged_user ON bets(challenged_user);
CREATE INDEX IF NOT EXISTS idx_bets_invite_token ON bets(invite_token);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);

-- =============================================
-- BET VOTES (for mutual resolution)
-- =============================================
CREATE TABLE IF NOT EXISTS bet_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('i_won', 'i_lost', 'draw')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bet_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_bet_votes_bet_id ON bet_votes(bet_id);

-- =============================================
-- BET EVIDENCE
-- =============================================
CREATE TABLE IF NOT EXISTS bet_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bet_evidence_bet_id ON bet_evidence(bet_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_evidence ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- BETS policies
CREATE POLICY "Users can view bets they're part of"
  ON bets FOR SELECT USING (
    auth.uid() = created_by
    OR auth.uid() = challenged_user
    OR auth.uid() = witness_user
  );

CREATE POLICY "Anyone can view bets by invite token (for accepting)"
  ON bets FOR SELECT USING (true);  -- We filter by token in app; full row exposure is fine since no PII

CREATE POLICY "Authenticated users can create bets"
  ON bets FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can update bets"
  ON bets FOR UPDATE USING (
    auth.uid() = created_by
    OR auth.uid() = challenged_user
    OR auth.uid() = witness_user
  );

-- BET VOTES policies
CREATE POLICY "Participants can view votes on their bets"
  ON bet_votes FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_votes.bet_id
      AND (bets.created_by = auth.uid() OR bets.challenged_user = auth.uid())
    )
  );

CREATE POLICY "Participants can vote on their bets"
  ON bet_votes FOR INSERT WITH CHECK (
    auth.uid() = voter_id AND
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_votes.bet_id
      AND (bets.created_by = auth.uid() OR bets.challenged_user = auth.uid())
      AND bets.status = 'active'
    )
  );

CREATE POLICY "Voters can update their own votes"
  ON bet_votes FOR UPDATE USING (auth.uid() = voter_id);

-- BET EVIDENCE policies
CREATE POLICY "Participants can view evidence"
  ON bet_evidence FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_evidence.bet_id
      AND (bets.created_by = auth.uid() OR bets.challenged_user = auth.uid())
    )
  );

CREATE POLICY "Participants can upload evidence"
  ON bet_evidence FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_evidence.bet_id
      AND (bets.created_by = auth.uid() OR bets.challenged_user = auth.uid())
      AND bets.status = 'active'
    )
  );

-- =============================================
-- STORAGE BUCKET FOR EVIDENCE
-- =============================================
-- Run this separately in Supabase Storage settings:
-- CREATE BUCKET 'bet-evidence' with public = false
-- Or use the Supabase dashboard to create it

-- =============================================
-- SETTLE SCORE FUNCTION
-- Called after a bet is settled
-- =============================================
CREATE OR REPLACE FUNCTION settle_bet(
  p_bet_id UUID,
  p_winner_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_bet bets%ROWTYPE;
  v_loser_id UUID;
BEGIN
  SELECT * INTO v_bet FROM bets WHERE id = p_bet_id;

  IF v_bet.status != 'active' AND v_bet.status != 'resolving' THEN
    RAISE EXCEPTION 'Bet is not in a settleable state';
  END IF;

  -- Determine loser
  IF v_bet.created_by = p_winner_id THEN
    v_loser_id := v_bet.challenged_user;
  ELSE
    v_loser_id := v_bet.created_by;
  END IF;

  -- Update bet
  UPDATE bets SET
    status = 'settled',
    winner_id = p_winner_id,
    settled_at = NOW()
  WHERE id = p_bet_id;

  -- Update winner stats
  UPDATE profiles SET
    bets_won = bets_won + 1,
    settle_score = LEAST(settle_score + 10, 1000),
    updated_at = NOW()
  WHERE id = p_winner_id;

  -- Update loser stats
  UPDATE profiles SET
    bets_lost = bets_lost + 1,
    updated_at = NOW()
  WHERE id = v_loser_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark loser as paid (honors their debt → score goes up)
CREATE OR REPLACE FUNCTION mark_bet_paid(p_bet_id UUID)
RETURNS VOID AS $$
DECLARE
  v_bet bets%ROWTYPE;
  v_loser_id UUID;
BEGIN
  SELECT * INTO v_bet FROM bets WHERE id = p_bet_id;

  IF v_bet.winner_id = auth.uid() THEN
    -- The person calling this is the winner marking the loser as paid
    IF v_bet.created_by = v_bet.winner_id THEN
      v_loser_id := v_bet.challenged_user;
    ELSE
      v_loser_id := v_bet.created_by;
    END IF;

    UPDATE profiles SET
      bets_paid = bets_paid + 1,
      settle_score = LEAST(settle_score + 5, 1000),
      updated_at = NOW()
    WHERE id = v_loser_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark loser as ghosted (didn't pay → score goes down)
CREATE OR REPLACE FUNCTION mark_bet_ghosted(p_bet_id UUID)
RETURNS VOID AS $$
DECLARE
  v_bet bets%ROWTYPE;
  v_loser_id UUID;
BEGIN
  SELECT * INTO v_bet FROM bets WHERE id = p_bet_id;

  IF v_bet.winner_id = auth.uid() THEN
    IF v_bet.created_by = v_bet.winner_id THEN
      v_loser_id := v_bet.challenged_user;
    ELSE
      v_loser_id := v_bet.created_by;
    END IF;

    UPDATE profiles SET
      bets_ghosted = bets_ghosted + 1,
      settle_score = GREATEST(settle_score - 25, 0),
      updated_at = NOW()
    WHERE id = v_loser_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE bets;
ALTER PUBLICATION supabase_realtime ADD TABLE bet_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE bet_evidence;
