import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ── Scroll reveal ─────────────────────────────────────────────
function useVisible(threshold = 0.1) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, vis]
}

// ── Ticker ─────────────────────────────────────────────────────
const TICKS = [
  '"Pay up"', '"I told you so"', '"Official record"',
  '"No excuses"', '"Put money on it"', '"You owe me"',
  '"I knew it"', '"Loser buys dinner"', '"Make it official"',
]
function Ticker() {
  const items = [...TICKS, ...TICKS]
  return (
    <div style={{ overflow: 'hidden', background: '#1a1a1a', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '14px 0' }}>
      <div style={{ display: 'inline-flex', whiteSpace: 'nowrap', animation: 'tickerScroll 22s linear infinite' }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0 28px' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: i % 3 === 0 ? '#c8ff00' : '#888' }}>{t}</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c8ff00', flexShrink: 0 }} />
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Demo Bet Card ──────────────────────────────────────────────
function DemoBetCard() {
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -1, left: 30, right: 30, height: 1, background: 'linear-gradient(90deg, transparent, #c8ff00, transparent)' }} />

      {/* Parties */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>😤</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>You</div>
            <div style={{ color: '#c8ff00', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>initiator</div>
          </div>
        </div>
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 100, padding: '6px 12px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: '#888' }}>VS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🙄</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Jordan</div>
          </div>
        </div>
      </div>

      {/* Statement */}
      <div style={{ background: '#111', borderRadius: 16, padding: 20, marginBottom: 20, fontSize: 17, lineHeight: 1.5, fontWeight: 500 }}>
        "I bet this song came out{' '}
        <span style={{ color: '#c8ff00' }}>before 2015.</span>
        {' '}If I'm wrong I'll buy the next round."
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>ON THE LINE</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 1 }}>1 Round 🍺</div>
        </div>
        <div style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00', border: '1px solid rgba(200,255,0,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 12, fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, background: '#c8ff00', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          Awaiting Jordan
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: 14, borderRadius: 14, border: '1px solid #333', background: '#111', color: '#f5f4f0', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>Decline</div>
        <div style={{ padding: 14, borderRadius: 14, background: '#c8ff00', color: '#0a0a0a', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>Accept Bet ✓</div>
      </div>
    </div>
  )
}

// ── Use cases ──────────────────────────────────────────────────
const USE_CASES = [
  { emoji: '🎵', text: 'When this song came out' },
  { emoji: '🏈', text: 'Who wins the game' },
  { emoji: '📏', text: "Who's actually taller" },
  { emoji: '🍕', text: 'Last slice goes to who' },
  { emoji: '🎬', text: 'What movie that actor was in' },
  { emoji: '⏱️', text: 'How long this drive takes' },
  { emoji: '🌡️', text: 'What the temp is right now' },
  { emoji: '💸', text: 'Who pays for dinner' },
  { emoji: '🎮', text: 'Next game winner' },
  { emoji: '🤌', text: 'Literally anything' },
]

// ── Side padding helper ────────────────────────────────────────
const P = 'clamp(20px, 5vw, 60px)'

// ─────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [cursor, setCursor] = useState({ x: -100, y: -100 })
  const [cursorBig, setCursorBig] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authRef = useRef(null)
  const [demoRef, demoVis] = useVisible(0.1)
  const [stepsRef, stepsVis] = useVisible(0.1)
  const [usesRef, usesVis] = useVisible(0.1)

  useEffect(() => {
    if (session) navigate('/feed', { replace: true })
  }, [session])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const onMouse = e => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('scroll', onScroll)
    window.addEventListener('mousemove', onMouse)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  function scrollToAuth() {
    setStep('phone'); setError('')
    setTimeout(() => authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  function formatPhone(raw) {
    const d = raw.replace(/\D/g, '')
    if (d.length === 10) return `+1${d}`
    if (d.startsWith('1') && d.length === 11) return `+${d}`
    return `+${d}`
  }

  async function sendOtp(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const formatted = formatPhone(phone)
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
      if (error) throw error
      setPhone(formatted); setStep('otp')
    } catch (err) { setError(err.message || 'Failed to send code.') }
    finally { setLoading(false) }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp.trim(), type: 'sms' })
      if (error) throw error
    } catch (err) { setError(err.message || 'Invalid code.'); setLoading(false) }
  }

  const hoverIn = e => {
    setCursorBig(true)
    const el = e.currentTarget
    if (el.dataset.hoverStyle === 'pill') {
      el.style.background = '#c8ff00'; el.style.color = '#0a0a0a'
    }
  }
  const hoverOut = e => {
    setCursorBig(false)
    const el = e.currentTarget
    if (el.dataset.hoverStyle === 'pill') {
      el.style.background = '#1a1a1a'; el.style.color = '#f5f4f0'
    }
  }

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', background: '#0a0a0a', color: '#f5f4f0', cursor: 'none' }}>

      {/* ── Custom cursor ── */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 9999,
        left: cursor.x, top: cursor.y,
        width: cursorBig ? 40 : 12,
        height: cursorBig ? 40 : 12,
        background: '#c8ff00', borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        transition: 'width 0.2s ease, height 0.2s ease',
        mixBlendMode: 'difference',
      }} />

      {/* ── Noise overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: `20px ${P}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #1a1a1a' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3 }}>
          SETTLE<span style={{ color: '#c8ff00' }}>.</span>
        </div>
        <button
          data-hover-style="pill"
          onMouseEnter={hoverIn} onMouseLeave={hoverOut}
          onClick={scrollToAuth}
          style={{
            background: '#1a1a1a', border: '1px solid #333', color: '#f5f4f0',
            padding: '10px 24px', borderRadius: 100, fontSize: 14, fontWeight: 500,
            cursor: 'none', transition: 'all 0.2s',
          }}
        >
          Sign In
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: `120px ${P} 80px`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ghost BG text */}
        <div style={{
          position: 'absolute', fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(120px, 22vw, 320px)', color: '#111',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', letterSpacing: -2,
        }}>SETTLE</div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Live tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#c8ff00', color: '#0a0a0a',
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
            padding: '6px 14px', borderRadius: 100,
            letterSpacing: 1, textTransform: 'uppercase', marginBottom: 32,
            animation: 'fadeUp 0.6s ease 0.2s both',
          }}>
            <span style={{ width: 6, height: 6, background: '#0a0a0a', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            Now Live
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(72px, 13vw, 180px)',
            lineHeight: 0.9, letterSpacing: -1, margin: 0,
            position: 'relative', zIndex: 2,
            animation: 'fadeUp 0.7s ease 0.3s both',
          }}>
            Make It
            <em style={{ fontStyle: 'normal', color: '#c8ff00', display: 'block' }}>Official.</em>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 'clamp(18px, 2.5vw, 26px)', color: '#888',
            maxWidth: 540, lineHeight: 1.5, marginTop: 32,
            animation: 'fadeUp 0.7s ease 0.5s both',
          }}>
            <strong style={{ color: '#f5f4f0' }}>The app for dumb bets with your friends.</strong>{' '}
            Say it, confirm it, settle it. No sportsbook. No setup. Just you, your friend, and who's right.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginTop: 48,
            animation: 'fadeUp 0.7s ease 0.7s both', flexWrap: 'wrap',
          }}>
            <button
              onMouseEnter={e => { setCursorBig(true); e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(200,255,0,0.35)' }}
              onMouseLeave={e => { setCursorBig(false); e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
              onClick={scrollToAuth}
              style={{
                background: '#c8ff00', color: '#0a0a0a', fontWeight: 700, fontSize: 16,
                padding: '16px 36px', borderRadius: 100, border: 'none', cursor: 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              Start Settling →
            </button>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#888' }}>
              Already <span style={{ color: '#c8ff00', fontWeight: 500 }}>247+</span> settlers
            </span>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <Ticker />

      {/* ── DEMO ── */}
      <section style={{ padding: `80px ${P}` }}>
        <div ref={demoRef} style={{
          opacity: demoVis ? 1 : 0, transform: demoVis ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#888', marginBottom: 48 }}>
            // How a bet looks
          </div>
          <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <DemoBetCard />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: `80px ${P}`, borderTop: '1px solid #1a1a1a' }}>
        <div ref={stepsRef}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3,
            textTransform: 'uppercase', color: '#888', marginBottom: 48,
            opacity: stepsVis ? 1 : 0, transition: 'opacity 0.5s ease',
          }}>
            // How it works
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 2, border: '1px solid #1a1a1a', borderRadius: 24, overflow: 'hidden',
            opacity: stepsVis ? 1 : 0, transform: stepsVis ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
          }}>
            {[
              { num: '01', title: 'Say the bet', desc: "Type out the bet in plain English. Anything. Sports, trivia, who's taller, who eats it first." },
              { num: '02', title: 'Both confirm', desc: "Your friend gets a notification. They tap accept. Now it's official. No take-backs." },
              { num: '03', title: 'Settle up', desc: "When it's done, one of you calls it. The loser gets notified. Your record updates. Receipts forever." },
              { num: '04', title: 'Pay up', desc: 'Winner requests payment via Venmo or CashApp — directly from the app.' },
            ].map((s, i) => (
              <div key={s.num}
                onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.querySelector('.step-num').style.color = '#c8ff00' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.querySelector('.step-num').style.color = '#222' }}
                style={{
                  padding: '40px 32px', background: '#1a1a1a',
                  borderLeft: i > 0 ? '1px solid #1a1a1a' : 'none',
                  transition: 'background 0.2s',
                }}
              >
                <div className="step-num" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: '#222', lineHeight: 1, marginBottom: 16, transition: 'color 0.2s' }}>{s.num}</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section style={{ padding: `80px ${P}`, borderTop: '1px solid #1a1a1a' }}>
        <div ref={usesRef}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3,
            textTransform: 'uppercase', color: '#888', marginBottom: 40,
            opacity: usesVis ? 1 : 0, transition: 'opacity 0.5s ease',
          }}>
            // Bet on anything
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10,
            opacity: usesVis ? 1 : 0, transform: usesVis ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
          }}>
            {USE_CASES.map(({ emoji, text }) => (
              <div key={text}
                onMouseEnter={e => { setCursorBig(true); e.currentTarget.style.borderColor = '#c8ff00'; e.currentTarget.style.color = '#c8ff00' }}
                onMouseLeave={e => { setCursorBig(false); e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#f5f4f0' }}
                style={{
                  background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 100,
                  padding: '12px 22px', fontSize: 15, cursor: 'none', transition: 'all 0.2s',
                }}
              >
                <span style={{ marginRight: 8 }}>{emoji}</span>{text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTH (replaces waitlist) ── */}
      <section
        ref={authRef}
        style={{
          padding: `100px ${P}`, textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          borderTop: '1px solid #1a1a1a',
        }}
      >
        {/* Radial glow */}
        <div style={{
          position: 'absolute', width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(200,255,0,0.07) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(52px, 9vw, 120px)',
          lineHeight: 0.95, marginBottom: 24,
          position: 'relative', zIndex: 2,
        }}>
          Stop<br />
          <span style={{ color: '#c8ff00' }}>Arguing.</span><br />
          Start Settling.
        </h2>

        <p style={{
          color: '#888', fontSize: 18, maxWidth: 400,
          margin: '0 auto 48px', lineHeight: 1.6,
          position: 'relative', zIndex: 2,
        }}>
          {step === 'otp'
            ? `Code sent to ${phone}. Check your texts.`
            : 'No passwords. Just your phone number. Be the first to make it official.'
          }
        </p>

        {/* Form */}
        <div style={{ maxWidth: 460, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {step === 'phone' ? (
            <form onSubmit={sendOtp} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="tel" placeholder="+1 (555) 000-0000"
                value={phone} onChange={e => setPhone(e.target.value)}
                required inputMode="tel"
                style={{
                  flex: 1, minWidth: 220,
                  background: '#1a1a1a', border: '1px solid #333', color: '#f5f4f0',
                  padding: '16px 24px', borderRadius: 100, fontSize: 15,
                  fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'text',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#c8ff00'}
                onBlur={e => e.currentTarget.style.borderColor = '#333'}
              />
              <button type="submit" disabled={loading || !phone.trim()}
                onMouseEnter={e => { setCursorBig(true); if (!loading) { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(200,255,0,0.3)' } }}
                onMouseLeave={e => { setCursorBig(false); e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                style={{
                  background: '#c8ff00', color: '#0a0a0a', fontWeight: 700, fontSize: 15,
                  padding: '16px 28px', borderRadius: 100, border: 'none',
                  cursor: loading ? 'default' : 'none', whiteSpace: 'nowrap',
                  opacity: loading || !phone.trim() ? 0.6 : 1, transition: 'all 0.2s',
                }}
              >
                {loading ? '...' : "I'm In →"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                <input
                  type="number" placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))}
                  required autoFocus inputMode="numeric"
                  style={{
                    flex: 1, minWidth: 160,
                    background: '#1a1a1a', border: '1px solid #333', color: '#f5f4f0',
                    padding: '16px 24px', borderRadius: 100, fontSize: 24,
                    fontFamily: "'DM Mono', monospace", letterSpacing: 8,
                    textAlign: 'center', outline: 'none', cursor: 'text',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#c8ff00'}
                  onBlur={e => e.currentTarget.style.borderColor = '#333'}
                />
                <button type="submit" disabled={loading || otp.length < 6}
                  onMouseEnter={e => { setCursorBig(true); if (!loading) { e.currentTarget.style.transform = 'scale(1.04)' } }}
                  onMouseLeave={e => { setCursorBig(false); e.currentTarget.style.transform = 'scale(1)' }}
                  style={{
                    background: '#c8ff00', color: '#0a0a0a', fontWeight: 700, fontSize: 15,
                    padding: '16px 28px', borderRadius: 100, border: 'none',
                    cursor: loading ? 'default' : 'none', whiteSpace: 'nowrap',
                    opacity: loading || otp.length < 6 ? 0.6 : 1, transition: 'all 0.2s',
                  }}
                >
                  {loading ? '...' : 'Verify →'}
                </button>
              </div>
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'none' }}>
                ← Change number
              </button>
            </form>
          )}

          {error && (
            <div style={{ marginTop: 16, color: '#ff4444', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 20, fontSize: 12, color: '#555', fontFamily: "'DM Mono', monospace", lineHeight: 1.7 }}>
            By continuing you agree to Settle's Terms. Settle never handles real money.
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: `40px ${P}`, borderTop: '1px solid #1a1a1a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3 }}>
          SETTLE<span style={{ color: '#c8ff00' }}>.</span>
        </div>
        <p style={{ fontSize: 13, color: '#888', fontFamily: "'DM Mono', monospace" }}>© 2026 Settle — Make It Official</p>
      </footer>

    </div>
  )
}
