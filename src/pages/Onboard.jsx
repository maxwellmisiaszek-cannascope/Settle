import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'

const EMOJIS = ['🎲','🏆','🔥','⚡','🎯','🎰','💀','🃏','🦁','🐯','🦊','🐺','🤝','💪','👊','🤜','😤','😈','🤑','💸','🍺','🎉','⚽','🏀','🎸','🚀']

export default function Onboard() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎲')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: name.trim(),
          avatar_emoji: emoji,
          phone: user.phone,
        })
      if (error) throw error
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="page-full" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 4 }}>
          SETTLE<span style={{ color: 'var(--acid)' }}>.</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card card-top-line">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1, marginBottom: 6 }}>
            SET UP YOUR<br />
            <span style={{ color: 'var(--acid)' }}>PROFILE</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--light)', marginBottom: 28 }}>
            This is how friends will see you in bets.
          </div>

          {/* Avatar emoji picker */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Pick Your Avatar</label>
            <div className="emoji-grid">
              {EMOJIS.map(em => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-btn ${emoji === em ? 'selected' : ''}`}
                  onClick={() => setEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#111', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            <div className="avatar-lg" style={{ width: 52, height: 52, fontSize: 26, background: '#2a2a2a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {emoji}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{name || 'Your Name'}</div>
              <div style={{ fontSize: 10, color: 'var(--acid)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>CHALLENGER</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              className="form-input large"
              type="text"
              placeholder="e.g. Jordan, Big Mike, The Oracle..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={32}
              required
              autoFocus
            />
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-acid btn-full"
          disabled={loading || !name.trim()}
        >
          {loading ? <span className="spinner spinner-sm" /> : "LET'S GO →"}
        </button>
      </form>
    </div>
  )
}
