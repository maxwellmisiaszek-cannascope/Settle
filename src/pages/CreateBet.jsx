import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'
import Nav from '../components/Nav.jsx'

const RESOLUTION_METHODS = [
  { id: 'mutual', label: '🤝 Mutual Agreement', desc: 'Both of you agree on the outcome' },
  { id: 'witness', label: '👁 Witness', desc: 'A trusted third party calls it' },
  { id: 'evidence', label: '📸 Evidence', desc: 'Photos or receipts settle it' },
]

const STAKE_SUGGESTIONS = ['Next round', 'Dinner on you', '$5', '$10', '$20', 'Bragging rights', 'Loser buys coffee', 'Loser does the dishes']

export default function CreateBet() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [stake, setStake] = useState('')
  const [opponentPhone, setOpponentPhone] = useState('')
  const [resolution, setResolution] = useState('mutual')
  const [witnessPhone, setWitnessPhone] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (!digits.startsWith('1') && digits.length === 10) return `+1${digits}`
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
    return `+${digits}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !stake.trim()) return
    setError('')
    setLoading(true)

    try {
      const formattedPhone = opponentPhone ? formatPhone(opponentPhone) : null
      const formattedWitness = witnessPhone && resolution === 'witness' ? formatPhone(witnessPhone) : null

      const { data: bet, error: betErr } = await supabase
        .from('bets')
        .insert({
          created_by: user.id,
          title: title.trim(),
          stake: stake.trim(),
          challenged_phone: formattedPhone,
          resolution_method: resolution,
          witness_phone: formattedWitness,
          note: note.trim() || null,
        })
        .select()
        .single()

      if (betErr) throw betErr

      // Navigate to bet detail to share the link
      navigate(`/bet/${bet.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create bet.')
      setLoading(false)
    }
  }

  return (
    <>
      <Nav title="NEW BET" showBack />
      <div className="page">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Bet statement */}
          <div className="card card-top-line">
            <div className="form-group">
              <label className="form-label">The Bet</label>
              <textarea
                className="form-input large"
                placeholder="I bet that Taylor Swift released Shake It Off before 2015..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                rows={3}
                maxLength={280}
                required
                autoFocus
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--mid)', fontFamily: 'var(--font-mono)' }}>
                {title.length}/280
              </div>
            </div>
          </div>

          {/* Stake */}
          <div className="card">
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Stake</label>
              <input
                className="form-input large"
                type="text"
                placeholder="Next round, $20, dinner, bragging rights..."
                value={stake}
                onChange={e => setStake(e.target.value)}
                maxLength={80}
                required
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STAKE_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStake(s)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: `1px solid ${stake === s ? 'var(--acid)' : 'var(--border)'}`,
                    background: stake === s ? 'rgba(200,255,0,0.1)' : '#111',
                    color: stake === s ? 'var(--acid)' : 'var(--light)',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Opponent */}
          <div className="card">
            <div className="form-group">
              <label className="form-label">Opponent's Phone (Optional)</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+1 (555) 000-0000 — or share the link instead"
                value={opponentPhone}
                onChange={e => setOpponentPhone(e.target.value)}
              />
              <div style={{ fontSize: 12, color: 'var(--mid)', lineHeight: 1.5 }}>
                Leave blank to get a shareable invite link.
              </div>
            </div>
          </div>

          {/* Resolution method */}
          <div className="card">
            <label className="form-label" style={{ display: 'block', marginBottom: 12 }}>
              How Will This Be Settled?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RESOLUTION_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setResolution(m.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${resolution === m.id ? 'var(--acid)' : 'var(--border)'}`,
                    background: resolution === m.id ? 'rgba(200,255,0,0.06)' : '#111',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: resolution === m.id ? 'var(--acid)' : 'var(--white)', marginBottom: 3 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mid)' }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {resolution === 'witness' && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Witness Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={witnessPhone}
                  onChange={e => setWitnessPhone(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Optional note */}
          <div className="card">
            <div className="form-group">
              <label className="form-label">Context / Notes (Optional)</label>
              <textarea
                className="form-input"
                placeholder="Any extra context about the bet..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                maxLength={200}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          {/* Preview */}
          {title && stake && (
            <div className="card" style={{ background: '#111', border: '1px solid rgba(200,255,0,0.15)' }}>
              <div className="label" style={{ marginBottom: 12 }}>Preview</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div className="avatar" style={{ background: '#2a2a2a' }}>{profile?.avatar_emoji || '🎲'}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{profile?.display_name || 'You'}</div>
                  <div style={{ fontSize: 9, color: 'var(--acid)', fontFamily: 'var(--font-mono)' }}>CHALLENGER</div>
                </div>
                <div style={{ margin: '0 auto', fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--mid)', letterSpacing: 2 }}>VS</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{opponentPhone ? 'Opponent' : '???'}</div>
                  <div style={{ fontSize: 9, color: 'var(--acid)', fontFamily: 'var(--font-mono)' }}>CHALLENGED</div>
                </div>
                <div className="avatar" style={{ background: '#2a2a2a' }}>❓</div>
              </div>
              <div className="bet-statement" style={{ fontSize: 13, marginBottom: 10 }}>"{title}"</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="bet-stake-label">STAKE</div>
                  <div className="bet-stake" style={{ fontSize: 20 }}>{stake}</div>
                </div>
                <span className="badge badge-pending"><span className="badge-dot" />PENDING</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-acid btn-full"
            disabled={loading || !title.trim() || !stake.trim()}
            style={{ marginBottom: 8 }}
          >
            {loading ? <span className="spinner spinner-sm" /> : '🎲 CREATE BET'}
          </button>
        </form>
      </div>
    </>
  )
}
