import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function AcceptBet() {
  const { token } = useParams()
  const { session, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [bet, setBet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  // Auth state for inline sign-in
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [authStep, setAuthStep] = useState('phone')
  const [authLoading2, setAuthLoading2] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    fetchBet()
  }, [token])

  useEffect(() => {
    // Once user is signed in, try to auto-accept
    if (user && bet && bet.status === 'pending' && bet.created_by !== user.id) {
      handleAccept()
    }
  }, [user, bet])

  async function fetchBet() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          challenger_profile:profiles!bets_created_by_fkey(id, display_name, avatar_emoji, settle_score)
        `)
        .eq('invite_token', token)
        .single()

      if (error) throw error
      setBet(data)
    } catch (err) {
      setError('This invite link is invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!user || !bet) return
    setAccepting(true)
    try {
      const { error } = await supabase
        .from('bets')
        .update({
          challenged_user: user.id,
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', bet.id)
        .eq('status', 'pending')

      if (error) throw error
      navigate(`/bet/${bet.id}`)
    } catch (err) {
      setError(err.message || 'Failed to accept bet.')
      setAccepting(false)
    }
  }

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (!digits.startsWith('1') && digits.length === 10) return `+1${digits}`
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
    return `+${digits}`
  }

  async function sendOtp(e) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading2(true)
    try {
      const formatted = formatPhone(phone)
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
      if (error) throw error
      setPhone(formatted)
      setAuthStep('otp')
    } catch (err) {
      setAuthError(err.message || 'Failed to send code.')
    } finally {
      setAuthLoading2(false)
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading2(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp.trim(), type: 'sms' })
      if (error) throw error
      // Session is now set — useEffect will trigger accept
    } catch (err) {
      setAuthError(err.message || 'Invalid code.')
      setAuthLoading2(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 4 }}>SETTLE<span style={{ color: 'var(--acid)' }}>.</span></div>
        <div className="spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 10 }}>LINK EXPIRED</div>
          <div style={{ fontSize: 14, color: 'var(--light)', lineHeight: 1.6 }}>{error}</div>
        </div>
      </div>
    )
  }

  // Already settled/cancelled
  if (bet && (bet.status === 'settled' || bet.status === 'cancelled')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="card card-top-line" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{bet.status === 'settled' ? '🏆' : '❌'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 10, letterSpacing: 1 }}>
            BET {bet.status.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, color: 'var(--light)' }}>This bet has already been {bet.status}.</div>
          {session && (
            <button className="btn btn-acid btn-full" style={{ marginTop: 20 }} onClick={() => navigate(`/bet/${bet.id}`)}>
              View Bet
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 5 }}>
          SETTLE<span style={{ color: 'var(--acid)' }}>.</span>
        </div>
        <div className="label">You've been challenged</div>
      </div>

      {/* Bet preview */}
      {bet && (
        <div className="card card-top-line" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="avatar" style={{ background: '#2a2a2a' }}>
              {bet.challenger_profile?.avatar_emoji || '🎲'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{bet.challenger_profile?.display_name}</div>
              <div style={{ fontSize: 10, color: 'var(--acid)', fontFamily: 'var(--font-mono)' }}>
                SETTLE SCORE: {bet.challenger_profile?.settle_score || 750}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--mid)', letterSpacing: 2 }}>
              CHALLENGES YOU
            </div>
          </div>

          <div className="bet-statement" style={{ fontSize: 16 }}>
            "{bet.title}"
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div>
              <div className="bet-stake-label">STAKE</div>
              <div className="bet-stake">{bet.stake}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label" style={{ marginBottom: 4 }}>RESOLUTION</div>
              <div style={{ fontSize: 13, color: 'var(--light)', textTransform: 'capitalize' }}>
                {bet.resolution_method || 'Mutual'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If already signed in as the correct user, show accept button */}
      {user && user.id !== bet?.created_by && bet?.status === 'pending' && (
        <button
          className="btn btn-acid btn-full"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? <span className="spinner spinner-sm" /> : "🤝 ACCEPT BET"}
        </button>
      )}

      {/* If signed in as the challenger themselves */}
      {user && user.id === bet?.created_by && (
        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--acid)' }}>This is your bet! Share the link with your opponent.</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => navigate(`/bet/${bet.id}`)}>
            View Bet →
          </button>
        </div>
      )}

      {/* Sign in flow for new/returning users */}
      {!user && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--light)', marginBottom: 8 }}>
            Sign in to accept this bet
          </div>

          <div className="card">
            {authStep === 'phone' ? (
              <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Your Phone Number</label>
                  <input
                    className="form-input large"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required autoFocus
                  />
                </div>
                {authError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{authError}</div>}
                <button type="submit" className="btn btn-acid btn-full" disabled={authLoading2 || !phone.trim()}>
                  {authLoading2 ? <span className="spinner spinner-sm" /> : 'SEND CODE'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 14, color: 'var(--light)' }}>Code sent to <strong style={{ color: 'var(--white)' }}>{phone}</strong></div>
                <div className="form-group">
                  <label className="form-label">6-Digit Code</label>
                  <input className="otp-input" type="number" placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))} required autoFocus inputMode="numeric" />
                </div>
                {authError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{authError}</div>}
                <button type="submit" className="btn btn-acid btn-full" disabled={authLoading2 || otp.length < 6}>
                  {authLoading2 ? <span className="spinner spinner-sm" /> : '🤝 VERIFY & ACCEPT'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAuthStep('phone'); setOtp(''); setAuthError('') }}>
                  ← Change Number
                </button>
              </form>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--mid)' }}>
            By accepting you agree to Settle's Terms of Service. Settle is a social record-keeping tool — no money is handled.
          </div>
        </div>
      )}
    </div>
  )
}
