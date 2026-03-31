import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (!digits.startsWith('1') && digits.length === 10) return `+1${digits}`
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
    if (!digits.startsWith('+')) return `+${digits}`
    return `+${digits}`
  }

  async function sendOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formatted = formatPhone(phone)
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
      if (error) throw error
      setPhone(formatted)
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send code. Check your number.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp.trim(),
        type: 'sms',
      })
      if (error) throw error
      // AuthContext will detect the session change and redirect
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="page-full" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 6, marginBottom: 8 }}>
          SETTLE<span style={{ color: 'var(--acid)' }}>.</span>
        </div>
        <div className="label">Make it official</div>
      </div>

      {step === 'phone' ? (
        <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-top-line">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, marginBottom: 8 }}>
                ENTER YOUR<br />
                <span style={{ color: 'var(--acid)' }}>PHONE NUMBER</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--light)', lineHeight: 1.6 }}>
                We'll text you a one-time code. No passwords, ever.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input large"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
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
            disabled={loading || !phone.trim()}
          >
            {loading ? <span className="spinner spinner-sm" /> : 'SEND CODE'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--mid)', lineHeight: 1.6 }}>
            By continuing you agree to Settle's{' '}
            <a href="#" style={{ color: 'var(--light)', textDecoration: 'underline' }}>Terms of Service</a>
            {' '}—{' '}this is a social record-keeping tool. Settle never handles money.
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-top-line">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, marginBottom: 8 }}>
                CHECK YOUR<br />
                <span style={{ color: 'var(--acid)' }}>TEXTS</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--light)', lineHeight: 1.6 }}>
                Code sent to <span style={{ color: 'var(--white)', fontWeight: 600 }}>{phone}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">6-Digit Code</label>
              <input
                className="otp-input"
                type="number"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.slice(0, 6))}
                required
                autoFocus
                inputMode="numeric"
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
            disabled={loading || otp.length < 6}
          >
            {loading ? <span className="spinner spinner-sm" /> : 'VERIFY CODE'}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-full"
            onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            disabled={loading}
          >
            ← Change Number
          </button>
        </form>
      )}
    </div>
  )
}
