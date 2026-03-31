import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'
import Nav from '../components/Nav.jsx'

const EMOJIS = ['🎲','🏆','🔥','⚡','🎯','🎰','💀','🃏','🦁','🐯','🦊','🐺','🤝','💪','👊','🤜','😤','😈','🤑','💸','🍺','🎉','⚽','🏀','🎸','🚀']

function ScoreTier(score) {
  if (score >= 900) return { label: 'LEGENDARY', color: '#ffd700' }
  if (score >= 800) return { label: 'RELIABLE', color: 'var(--green)' }
  if (score >= 700) return { label: 'SOLID', color: 'var(--acid)' }
  if (score >= 600) return { label: 'SHAKY', color: '#ffa500' }
  return { label: 'FLAKY', color: 'var(--red)' }
}

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.display_name || '')
  const [emoji, setEmoji] = useState(profile?.avatar_emoji || '🎲')
  const [venmo, setVenmo] = useState(profile?.venmo_username || '')
  const [cashapp, setCashapp] = useState(profile?.cashapp_username || '')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  if (!profile) return null

  const tier = ScoreTier(profile.settle_score)
  const scorePercent = Math.min(profile.settle_score / 1000, 1) * 100
  const totalBets = profile.bets_won + profile.bets_lost

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveProfile() {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: name.trim(),
          avatar_emoji: emoji,
          venmo_username: venmo.replace('@', '').trim() || null,
          cashapp_username: cashapp.replace('$', '').trim() || null,
        })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setEditing(false)
      showToast('Profile updated!')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Nav title="PROFILE" />
      <div className="page">

        {/* Score card */}
        <div className="card card-top-line" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
              }}>
                {profile.avatar_emoji}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 1, lineHeight: 1 }}>
                  {profile.display_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--light)', marginTop: 4 }}>
                  {profile.phone}
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setEditing(!editing); setName(profile.display_name); setEmoji(profile.avatar_emoji); setVenmo(profile.venmo_username || ''); setCashapp(profile.cashapp_username || '') }}
            >
              {editing ? '✕' : 'Edit'}
            </button>
          </div>

          {/* Settle Score */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <div className="score-big">{profile.settle_score}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: tier.color, letterSpacing: 2 }}>
                {tier.label}
              </div>
            </div>
            <div className="label" style={{ marginBottom: 10 }}>SETTLE SCORE</div>
            <div className="score-bar-wrap">
              <div className="score-bar" style={{ width: `${scorePercent}%`, background: tier.color }} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 4 }}>
            {[
              { n: profile.bets_won, l: 'WON', c: 'var(--green)' },
              { n: profile.bets_lost, l: 'LOST', c: 'var(--red)' },
              { n: profile.bets_paid, l: 'PAID', c: 'var(--acid)' },
              { n: profile.bets_ghosted, l: 'GHOSTED', c: 'var(--mid)' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: s.c, letterSpacing: 1 }}>{s.n}</div>
                <div className="label">{s.l}</div>
              </div>
            ))}
          </div>

          {totalBets > 0 && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#111', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--light)' }}>
              Win rate:{' '}
              <span style={{ color: 'var(--acid)', fontWeight: 700 }}>
                {Math.round((profile.bets_won / totalBets) * 100)}%
              </span>
              {' '}across {totalBets} settled bet{totalBets !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 16 }}>EDIT PROFILE</div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Display Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} maxLength={32} />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Avatar</label>
              <div className="emoji-grid">
                {EMOJIS.map(em => (
                  <button key={em} type="button" className={`emoji-btn ${emoji === em ? 'selected' : ''}`} onClick={() => setEmoji(em)}>{em}</button>
                ))}
              </div>
            </div>

            <div className="divider" />
            <div className="label" style={{ margin: '16px 0 12px' }}>PAYMENT HANDLES (for auto-deeplinks)</div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Venmo Username</label>
              <input className="form-input" placeholder="@username" value={venmo} onChange={e => setVenmo(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Cash App $Cashtag</label>
              <input className="form-input" placeholder="$cashtag" value={cashapp} onChange={e => setCashapp(e.target.value)} />
            </div>

            <button
              className="btn btn-acid btn-full"
              onClick={saveProfile}
              disabled={loading || !name.trim()}
            >
              {loading ? <span className="spinner spinner-sm" /> : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Score explainer */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 14 }}>HOW SETTLE SCORE WORKS</div>
          {[
            { e: '🏆', a: 'Win a bet', p: '+10' },
            { e: '✅', a: 'Loser pays up', p: '+5 for them' },
            { e: '👻', a: 'Ghost on a bet', p: '-25' },
          ].map(r => (
            <div key={r.a} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.e}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--light)' }}>{r.a}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--acid)' }}>{r.p}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#111', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--mid)' }}>
            Scores are public. Everyone sees if you pay up or ghost.
          </div>
        </div>

        {/* Sign out */}
        <button
          className="btn btn-ghost btn-full"
          onClick={signOut}
          style={{ marginTop: 8, color: 'var(--mid)' }}
        >
          Sign Out
        </button>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </>
  )
}
