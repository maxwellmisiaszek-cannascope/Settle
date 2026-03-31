import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'
import Nav from '../components/Nav.jsx'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'PENDING', active: 'ACTIVE', resolving: 'RESOLVING', settled: 'SETTLED', cancelled: 'CANCELLED', disputed: 'DISPUTED' }
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {map[status] || status.toUpperCase()}
    </span>
  )
}

export default function BetDetail() {
  const { id } = useParams()
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [bet, setBet] = useState(null)
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [evidenceFile, setEvidenceFile] = useState(null)

  useEffect(() => {
    fetchBet()

    const channel = supabase
      .channel(`bet-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets', filter: `id=eq.${id}` }, fetchBet)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bet_votes', filter: `bet_id=eq.${id}` }, fetchVotes)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  async function fetchBet() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          challenger_profile:profiles!bets_created_by_fkey(id, display_name, avatar_emoji, venmo_username, cashapp_username),
          challenged_profile:profiles!bets_challenged_user_fkey(id, display_name, avatar_emoji, venmo_username, cashapp_username),
          winner_profile:profiles!bets_winner_id_fkey(id, display_name, avatar_emoji)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setBet(data)
      fetchVotes()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchVotes() {
    const { data } = await supabase
      .from('bet_votes')
      .select('*')
      .eq('bet_id', id)
    setVotes(data || [])
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const inviteUrl = bet ? `${window.location.origin}/accept/${bet.invite_token}` : ''

  const isChallenger = bet?.created_by === user?.id
  const isChallenged = bet?.challenged_user === user?.id
  const isParticipant = isChallenger || isChallenged
  const isWitness = bet?.witness_user === user?.id

  const myVote = votes.find(v => v.voter_id === user?.id)
  const myProfile = isChallenger ? bet?.challenger_profile : bet?.challenged_profile
  const theirProfile = isChallenger ? bet?.challenged_profile : bet?.challenger_profile

  async function submitVote(vote) {
    setActionLoading(true)
    try {
      // Upsert vote
      const { error: voteErr } = await supabase
        .from('bet_votes')
        .upsert({ bet_id: id, voter_id: user.id, vote }, { onConflict: 'bet_id,voter_id' })

      if (voteErr) throw voteErr

      // Update bet status to resolving
      await supabase.from('bets').update({ status: 'resolving' }).eq('id', id)

      // Fetch updated votes to check for consensus
      const { data: updatedVotes } = await supabase
        .from('bet_votes')
        .select('*')
        .eq('bet_id', id)

      const votesList = updatedVotes || []
      const challengerVote = votesList.find(v => v.voter_id === bet.created_by)
      const challengedVote = votesList.find(v => v.voter_id === bet.challenged_user)

      // Check for consensus
      if (challengerVote && challengedVote) {
        let winnerId = null
        // Both say same person won
        if (challengerVote.vote === 'i_won' && challengedVote.vote === 'i_lost') {
          winnerId = bet.created_by
        } else if (challengerVote.vote === 'i_lost' && challengedVote.vote === 'i_won') {
          winnerId = bet.challenged_user
        } else if (challengerVote.vote === 'draw' && challengedVote.vote === 'draw') {
          // Draw — no winner
          await supabase.from('bets').update({ status: 'settled', settled_at: new Date().toISOString() }).eq('id', id)
          showToast("It's a draw! Bet settled.")
          await fetchBet()
          await refreshProfile()
          return
        } else {
          // Disputed
          await supabase.from('bets').update({ status: 'disputed' }).eq('id', id)
          showToast('Votes conflict — bet is disputed. Use evidence or a witness.', 'error')
          await fetchBet()
          return
        }

        if (winnerId) {
          const { error: settleErr } = await supabase.rpc('settle_bet', {
            p_bet_id: id,
            p_winner_id: winnerId,
          })
          if (settleErr) throw settleErr
          showToast('Bet settled! 🏆')
          await refreshProfile()
        }
      } else {
        showToast('Vote recorded. Waiting for the other side...')
      }

      await fetchBet()
    } catch (err) {
      showToast(err.message || 'Failed to submit vote.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function cancelBet() {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('bets')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('created_by', user.id)
      if (error) throw error
      showToast('Bet cancelled.')
      await fetchBet()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function uploadEvidence(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setActionLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${id}/${user.id}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('bet-evidence')
        .upload(path, file)

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('bet-evidence')
        .getPublicUrl(path)

      await supabase.from('bet_evidence').insert({
        bet_id: id,
        uploaded_by: user.id,
        file_url: publicUrl,
        file_type: file.type,
      })

      showToast('Evidence uploaded! 📸')
      await fetchBet()
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function witnessVerdict(verdict) {
    setActionLoading(true)
    try {
      await supabase.from('bets').update({ witness_verdict: verdict }).eq('id', id)

      const winnerId = verdict === 'challenger' ? bet.created_by : bet.challenged_user

      if (verdict !== 'draw') {
        await supabase.rpc('settle_bet', { p_bet_id: id, p_winner_id: winnerId })
        showToast('Witness verdict recorded. Bet settled! 🏆')
        await refreshProfile()
      } else {
        await supabase.from('bets').update({ status: 'settled', settled_at: new Date().toISOString() }).eq('id', id)
        showToast("Witness says draw!")
      }
      await fetchBet()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function markPaid() {
    setActionLoading(true)
    try {
      await supabase.rpc('mark_bet_paid', { p_bet_id: id })
      showToast('Marked as paid. Respect. ✅')
      await refreshProfile()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function markGhosted() {
    setActionLoading(true)
    try {
      await supabase.rpc('mark_bet_ghosted', { p_bet_id: id })
      showToast('Ghosted logged. Their score takes a hit. 👻')
      await refreshProfile()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Nav title="BET" showBack />
        <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div className="spinner" />
        </div>
      </>
    )
  }

  if (!bet) {
    return (
      <>
        <Nav title="BET" showBack />
        <div className="page">
          <div className="empty">
            <div className="empty-icon">❓</div>
            <div className="empty-title">BET NOT FOUND</div>
            <div className="empty-desc">This bet doesn't exist or you don't have access.</div>
          </div>
        </div>
      </>
    )
  }

  const loserProfile = bet.winner_id === bet.created_by ? bet.challenged_profile : bet.challenger_profile
  const venmoUsername = loserProfile?.venmo_username
  const cashappUsername = loserProfile?.cashapp_username

  return (
    <>
      <Nav title="BET DETAIL" showBack />
      <div className="page">

        {/* Main bet card */}
        <div className="card card-top-line" style={{ marginBottom: 16 }}>
          {/* Parties */}
          <div className="bet-parties" style={{ marginBottom: 20 }}>
            <div className="bet-party">
              <div className="avatar">{bet.challenger_profile?.avatar_emoji || '🎲'}</div>
              <div>
                <div className="bet-party-name">{bet.challenger_profile?.display_name || 'Unknown'}</div>
                <div className="bet-party-tag">CHALLENGER</div>
              </div>
            </div>
            <div className="vs-badge">VS</div>
            <div className="bet-party" style={{ flexDirection: 'row-reverse' }}>
              <div className="avatar">{bet.challenged_profile?.avatar_emoji || (bet.challenged_phone ? '📱' : '❓')}</div>
              <div style={{ textAlign: 'right' }}>
                <div className="bet-party-name">{bet.challenged_profile?.display_name || (bet.challenged_phone ? `+••••${bet.challenged_phone?.slice(-4)}` : 'Pending')}</div>
                <div className="bet-party-tag">CHALLENGED</div>
              </div>
            </div>
          </div>

          {/* Statement */}
          <div className="bet-statement" style={{ fontSize: 16, marginBottom: 16 }}>
            "{bet.title}"
          </div>

          {/* Note */}
          {bet.note && (
            <div style={{ padding: '10px 14px', background: '#111', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--light)', marginBottom: 16 }}>
              {bet.note}
            </div>
          )}

          {/* Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div className="bet-stake-label">STAKE</div>
              <div className="bet-stake">{bet.stake}</div>
              <div style={{ marginTop: 6 }}>
                <StatusBadge status={bet.status} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label" style={{ marginBottom: 4 }}>RESOLUTION</div>
              <div style={{ fontSize: 13, color: 'var(--light)', textTransform: 'capitalize' }}>
                {bet.resolution_method || 'Mutual'}
              </div>
            </div>
          </div>
        </div>

        {/* Winner banner */}
        {bet.status === 'settled' && bet.winner_profile && (
          <div style={{
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)',
            borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 32 }}>🏆</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--green)', letterSpacing: 1 }}>
                {bet.winner_profile.id === user.id ? 'YOU WON!' : `${bet.winner_profile.display_name} WON`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--light)' }}>
                Settled {bet.settled_at ? new Date(bet.settled_at).toLocaleDateString() : ''}
              </div>
            </div>
          </div>
        )}

        {/* INVITE LINK — show when pending */}
        {bet.status === 'pending' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 12 }}>INVITE LINK</div>
            <div className="copy-box">
              <span className="copy-url">{inviteUrl}</span>
              <CopyButton text={inviteUrl} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--mid)', marginTop: 10, lineHeight: 1.5 }}>
              Send this to your opponent. When they accept, the bet goes live.
            </div>

            {isChallenger && (
              <button
                className="btn btn-danger btn-sm btn-full"
                style={{ marginTop: 16 }}
                onClick={cancelBet}
                disabled={actionLoading}
              >
                Cancel Bet
              </button>
            )}
          </div>
        )}

        {/* VOTING — mutual resolution when active */}
        {(bet.status === 'active' || bet.status === 'resolving') && bet.resolution_method === 'mutual' && isParticipant && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 12 }}>DECLARE OUTCOME</div>
            {myVote ? (
              <div style={{ padding: '12px 16px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--acid)' }}>
                ✓ Your vote: <strong>{myVote.vote === 'i_won' ? 'I won' : myVote.vote === 'i_lost' ? 'I lost' : 'Draw'}</strong>
                {' '}— waiting for the other side.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => submitVote('i_won')}
                  disabled={actionLoading}
                  style={{ flexDirection: 'column', gap: 4, padding: '14px 8px' }}
                >
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <span style={{ fontSize: 12 }}>I Won</span>
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => submitVote('i_lost')}
                  disabled={actionLoading}
                  style={{ flexDirection: 'column', gap: 4, padding: '14px 8px' }}
                >
                  <span style={{ fontSize: 20 }}>💸</span>
                  <span style={{ fontSize: 12 }}>I Lost</span>
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => submitVote('draw')}
                  disabled={actionLoading}
                  style={{ flexDirection: 'column', gap: 4, padding: '14px 8px' }}
                >
                  <span style={{ fontSize: 20 }}>🤝</span>
                  <span style={{ fontSize: 12 }}>Draw</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE upload */}
        {(bet.status === 'active' || bet.status === 'resolving') && bet.resolution_method === 'evidence' && isParticipant && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 12 }}>UPLOAD EVIDENCE</div>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '20px', background: '#111', borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--border)', cursor: 'pointer', transition: 'all 0.15s',
              fontSize: 14, color: 'var(--light)',
            }}>
              <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={uploadEvidence} />
              <span style={{ fontSize: 24 }}>📸</span>
              {actionLoading ? 'Uploading...' : 'Tap to upload photo or video'}
            </label>
          </div>
        )}

        {/* WITNESS verdict */}
        {(bet.status === 'active' || bet.status === 'resolving') && bet.resolution_method === 'witness' && isWitness && !bet.witness_verdict && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 4 }}>WITNESS VERDICT</div>
            <div style={{ fontSize: 13, color: 'var(--light)', marginBottom: 16 }}>
              You've been called as a witness. Who won?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => witnessVerdict('challenger')} disabled={actionLoading} style={{ flexDirection: 'column', gap: 4, padding: '14px 8px' }}>
                <span style={{ fontSize: 16 }}>{bet.challenger_profile?.avatar_emoji || '🎲'}</span>
                <span style={{ fontSize: 11 }}>{bet.challenger_profile?.display_name || 'Challenger'}</span>
              </button>
              <button className="btn btn-ghost" onClick={() => witnessVerdict('draw')} disabled={actionLoading} style={{ flexDirection: 'column', gap: 4, padding: '14px 8px' }}>
                <span style={{ fontSize: 20 }}>🤝</span>
                <span style={{ fontSize: 11 }}>Draw</span>
              </button>
              <button className="btn btn-ghost" onClick={() => witnessVerdict('challenged')} disabled={actionLoading} style={{ flexDirection: 'column', gap: 4, padding: '14px 8px' }}>
                <span style={{ fontSize: 16 }}>{bet.challenged_profile?.avatar_emoji || '❓'}</span>
                <span style={{ fontSize: 11 }}>{bet.challenged_profile?.display_name || 'Challenged'}</span>
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT — show to winner after settled */}
        {bet.status === 'settled' && bet.winner_id === user.id && loserProfile && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 12 }}>REQUEST PAYMENT</div>
            <div style={{ fontSize: 13, color: 'var(--light)', marginBottom: 16 }}>
              Time for {loserProfile.display_name} to settle up. Send a request:
            </div>
            <div className="pay-row">
              {venmoUsername ? (
                <a
                  href={`venmo://paycharge?txn=charge&recipients=${venmoUsername}&note=${encodeURIComponent(`Settle bet: ${bet.title}`)}`}
                  className="pay-btn pay-btn-venmo"
                >
                  <span>V</span> Venmo
                </a>
              ) : (
                <div className="pay-btn" style={{ opacity: 0.4, cursor: 'default' }}>
                  <span>V</span> Venmo
                </div>
              )}
              {cashappUsername ? (
                <a
                  href={`https://cash.app/$${cashappUsername}`}
                  className="pay-btn pay-btn-cashapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>$</span> Cash App
                </a>
              ) : (
                <div className="pay-btn" style={{ opacity: 0.4, cursor: 'default' }}>
                  <span>$</span> Cash App
                </div>
              )}
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12, color: 'var(--mid)', marginBottom: 12 }}>Did they follow through?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={markPaid} disabled={actionLoading}>
                ✅ They paid
              </button>
              <button className="btn btn-danger btn-sm" onClick={markGhosted} disabled={actionLoading}>
                👻 Ghosted
              </button>
            </div>
          </div>
        )}

        {/* Votes status */}
        {votes.length > 0 && bet.status !== 'settled' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 12 }}>VOTES SO FAR</div>
            {votes.map(v => {
              const voterProfile = v.voter_id === bet.created_by ? bet.challenger_profile : bet.challenged_profile
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="avatar avatar-sm">{voterProfile?.avatar_emoji || '🎲'}</div>
                  <div style={{ flex: 1, fontSize: 13 }}>{voterProfile?.display_name}</div>
                  <span className="badge badge-active" style={{ fontSize: 10 }}>
                    {v.vote === 'i_won' ? '🏆 I won' : v.vote === 'i_lost' ? '💸 I lost' : '🤝 Draw'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Meta footer */}
        <div style={{ fontSize: 11, color: 'var(--mid)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
          CREATED {new Date(bet.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
          {bet.witness_phone && ` · WITNESS: +••••${bet.witness_phone.slice(-4)}`}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </>
  )
}
