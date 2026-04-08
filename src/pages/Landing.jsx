import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ── Ticker ────────────────────────────────────────────────────
const TICKS = [
  '"Pay up"', '"I told you so"', '"Official record"',
  '"No excuses"', '"Put money on it"', '"You owe me"',
  '"I knew it"', '"Loser buys dinner"', '"Make it official"',
]
function Ticker() {
  const items = [...TICKS, ...TICKS]
  return (
    <div style={{
      overflow: 'hidden', background: 'var(--gray)',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      padding: '14px 0',
    }}>
      <div style={{
        display: 'inline-flex', whiteSpace: 'nowrap',
        animation: 'tickerScroll 22s linear infinite',
      }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0 28px' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 16,
              letterSpacing: 2, color: i % 3 === 0 ? 'var(--acid)' : 'var(--mid)',
            }}>{t}</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--acid)', flexShrink: 0 }} />
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Demo Bet Card ─────────────────────────────────────────────
function DemoBetCard() {
  return (
    <div style={{
      background: 'var(--gray)', border: '1px solid #2a2a2a',
      borderRadius: 'var(--radius-lg)', padding: '24px',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    }}>
      {/* acid top line */}
      <div style={{
        position: 'absolute', top: -1, left: 30, right: 30, height: 2,
        background: 'linear-gradient(90deg, transparent, var(--acid), transparent)',
      }} />

      {/* Parties */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔥</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>JAKE M.</div>
            <div style={{ fontSize: 10, color: 'var(--acid)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>CHALLENGER</div>
          </div>
        </div>
        <div style={{
          background: '#111', border: '1px solid #333', borderRadius: 'var(--radius-pill)',
          padding: '5px 12px', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 2, color: 'var(--mid)',
        }}>VS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'right' }}>SAM K.</div>
            <div style={{ fontSize: 10, color: 'var(--mid)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, textAlign: 'right' }}>OPPONENT</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💀</div>
        </div>
      </div>

      {/* Statement */}
      <div style={{
        background: '#111', borderRadius: 'var(--radius-md)', padding: '16px 18px',
        marginBottom: 18, fontSize: 16, lineHeight: 1.55, fontWeight: 500,
      }}>
        The Patriots <span style={{ color: 'var(--acid)' }}>will not</span> make the playoffs this season.
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--mid)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>STAKE</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1 }}>$50</div>
        </div>
        <div style={{
          background: 'rgba(200,255,0,0.08)', color: 'var(--acid)',
          border: '1px solid rgba(200,255,0,0.25)', borderRadius: 'var(--radius-pill)',
          padding: '7px 14px', fontSize: 11, fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 6, height: 6, background: 'var(--acid)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          LIVE
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{
          padding: '13px', borderRadius: 'var(--radius-md)', border: '1px solid #333',
          background: '#111', textAlign: 'center', fontSize: 14, fontWeight: 600,
        }}>I WON ✓</div>
        <div style={{
          padding: '13px', borderRadius: 'var(--radius-md)',
          background: 'var(--acid)', color: 'var(--black)',
          textAlign: 'center', fontSize: 14, fontWeight: 700,
        }}>THEY WON ✓</div>
      </div>
    </div>
  )
}

// ── Step card ─────────────────────────────────────────────────
function Step({ num, icon, title, desc, visible, delay }) {
  return (
    <div style={{
      padding: '24px 20px',
      borderBottom: '1px solid var(--border)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
          background: 'var(--gray)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>{icon}</div>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
            color: 'var(--acid)', marginBottom: 4,
          }}>0{num}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 1, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--light)', lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
    </div>
  )
}

// ── Section observer ──────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [authMode, setAuthMode] = useState(null) // null | 'new' | 'returning'
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scrolled, setScrolled] = useState(false)

  const authRef = useRef(null)
  const [heroRef, heroVis] = useVisible(0.05)
  const [demoRef, demoVis] = useVisible(0.1)
  const [stepsRef, stepsVis] = useVisible(0.1)
  const [scoreRef, scoreVis] = useVisible(0.1)
  const [authSecRef, authSecVis] = useVisible(0.05)

  useEffect(() => {
    if (session) navigate('/feed', { replace: true })
  }, [session])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToAuth(mode) {
    setAuthMode(mode)
    setStep('phone')
    setError('')
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

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── STICKY NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 4 }}>
          SETTLE<span style={{ color: 'var(--acid)' }}>.</span>
        </div>
        <button
          onClick={() => scrollToAuth('returning')}
          style={{
            background: 'var(--gray)', border: '1px solid #333',
            color: 'var(--white)', padding: '9px 22px',
            borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--acid)'; e.currentTarget.style.color = 'var(--black)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray)'; e.currentTarget.style.color = 'var(--white)' }}
        >
          Sign In
        </button>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '120px 20px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Giant ghost text */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(100px, 40vw, 280px)',
          color: '#111', whiteSpace: 'nowrap',
          pointerEvents: 'none', userSelect: 'none',
          letterSpacing: -4, lineHeight: 1,
          opacity: heroVis ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}>SETTLE</div>

        {/* Noise grain */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.35,
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Live tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--acid)', color: 'var(--black)',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
            padding: '6px 14px', borderRadius: 'var(--radius-pill)',
            letterSpacing: 1.5, marginBottom: 28,
            opacity: heroVis ? 1 : 0,
            transform: heroVis ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--black)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            NOW LIVE — MAKE IT OFFICIAL
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(72px, 22vw, 160px)',
            lineHeight: 0.88, letterSpacing: -2,
            opacity: heroVis ? 1 : 0,
            transform: heroVis ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s',
            marginBottom: 0,
          }}>
            BETS ARE
            <br />
            <span style={{ color: 'var(--acid)' }}>SERIOUS.</span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 16, color: 'var(--light)', lineHeight: 1.7,
            marginTop: 24, maxWidth: 380,
            opacity: heroVis ? 1 : 0,
            transform: heroVis ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s',
          }}>
            Settle tracks your bets, protects your reputation, and makes sure <strong style={{ color: 'var(--white)' }}>nobody ghosts</strong> when they lose.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            marginTop: 40,
            opacity: heroVis ? 1 : 0,
            transform: heroVis ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.7s ease 0.65s, transform 0.7s ease 0.65s',
          }}>
            <button
              onClick={() => scrollToAuth('new')}
              style={{
                background: 'var(--acid)', color: 'var(--black)',
                border: 'none', borderRadius: 'var(--radius-pill)',
                padding: '18px 40px', fontWeight: 700, fontSize: 16,
                cursor: 'pointer', letterSpacing: 1,
                boxShadow: '0 0 48px rgba(200,255,0,0.2)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 64px rgba(200,255,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 48px rgba(200,255,0,0.2)' }}
            >
              START SETTLING →
            </button>
            <button
              onClick={() => scrollToAuth('returning')}
              style={{
                background: 'transparent', color: 'var(--mid)',
                border: 'none', padding: '8px', cursor: 'pointer',
                fontSize: 13, letterSpacing: 0.5,
              }}
            >
              Already a settler? Sign in
            </button>
          </div>

          {/* Social proof */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginTop: 48,
            opacity: heroVis ? 1 : 0,
            transition: 'opacity 0.7s ease 0.9s',
          }}>
            <div style={{ display: 'flex' }}>
              {['🔥','💀','⚡','🎯','🤑'].map((e, i) => (
                <div key={i} style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--gray)', border: '2px solid var(--black)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, marginLeft: i === 0 ? 0 : -10,
                }}>{e}</div>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mid)' }}>
              <span style={{ color: 'var(--acid)' }}>247+</span> settlers so far
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <Ticker />

      {/* ── DEMO BET CARD ── */}
      <section ref={demoRef} style={{ padding: '80px 20px' }}>
        <div style={{
          opacity: demoVis ? 1 : 0,
          transform: demoVis ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--mid)', marginBottom: 16 }}>
            // WHAT IT LOOKS LIKE
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 12vw, 64px)',
            letterSpacing: 1, lineHeight: 0.9, marginBottom: 32,
          }}>
            EVERY BET.<br />
            <span style={{ color: 'var(--acid)' }}>ON RECORD.</span>
          </div>
          <DemoBetCard />
          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--mid)', lineHeight: 1.7 }}>
            Both parties vote on the outcome. Dispute it? Bring in a witness or submit evidence. Your Settle Score updates automatically.
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={stepsRef} style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          padding: '48px 20px 0',
          opacity: stepsVis ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--mid)', marginBottom: 8 }}>// HOW IT WORKS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 1, marginBottom: 0 }}>
            FOUR STEPS.<br /><span style={{ color: 'var(--acid)' }}>NO EXCUSES.</span>
          </div>
        </div>
        <Step num={1} icon="🤝" title="MAKE THE BET" desc="Set a title, stake, and opponent. Send them a link to accept." visible={stepsVis} delay={100} />
        <Step num={2} icon="✅" title="GO LIVE" desc="Opponent accepts. The bet is now official on both your records." visible={stepsVis} delay={200} />
        <Step num={3} icon="⚖️" title="RESOLVE IT" desc="Both vote on who won. Disagree? Witness or evidence settles it." visible={stepsVis} delay={300} />
        <Step num={4} icon="💸" title="PAY UP" desc="Winner requests payment via Venmo or CashApp — directly from the app." visible={stepsVis} delay={400} />
      </section>

      {/* ── SETTLE SCORE ── */}
      <section ref={scoreRef} style={{ padding: '80px 20px' }}>
        <div style={{
          opacity: scoreVis ? 1 : 0,
          transform: scoreVis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--mid)', marginBottom: 8 }}>// YOUR REP</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 12vw, 56px)', letterSpacing: 1, marginBottom: 20 }}>
            THE SETTLE<br /><span style={{ color: 'var(--acid)' }}>SCORE.</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--light)', lineHeight: 1.7, marginBottom: 32 }}>
            A live score from 0–1000. Win bets. Pay on time. Build your reputation.
            Ghost someone? Everyone sees it.
          </p>

          {/* Score tiers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { tier: 'LEGENDARY', range: '900–1000', color: '#FFD700', w: '100%' },
              { tier: 'RELIABLE',  range: '750–899',  color: 'var(--acid)', w: '85%' },
              { tier: 'SOLID',     range: '600–749',  color: '#7EB3FF', w: '68%' },
              { tier: 'SHAKY',     range: '400–599',  color: '#FF9B3D', w: '48%' },
              { tier: 'FLAKY',     range: '0–399',    color: 'var(--red)', w: '28%' },
            ].map(({ tier, range, color, w }, i) => (
              <div key={tier} style={{
                background: 'var(--gray)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px',
                opacity: scoreVis ? 1 : 0,
                transition: `opacity 0.5s ease ${i * 80}ms`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 1, color }}>{tier}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mid)' }}>{range}</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: color,
                    width: scoreVis ? w : '0%',
                    transition: `width 1s ease ${0.3 + i * 0.1}s`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTH ── */}
      <section
        ref={(el) => { authRef.current = el; if (authSecRef && authSecRef.current !== undefined) authSecRef.current = el }}
        style={{
          padding: '60px 20px 80px',
          borderTop: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--black) 0%, rgba(200,255,0,0.03) 100%)',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          {authMode === 'returning' ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, lineHeight: 0.9, marginBottom: 12 }}>
                WELCOME<br /><span style={{ color: 'var(--acid)' }}>BACK.</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--mid)' }}>Sign in to your Settle account.</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, lineHeight: 0.9, marginBottom: 12 }}>
                READY TO<br /><span style={{ color: 'var(--acid)' }}>SETTLE?</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--mid)' }}>No passwords. Just your phone number.</div>
            </>
          )}
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex', background: 'var(--gray)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24,
        }}>
          {[{ mode: 'new', label: "I'M NEW" }, { mode: 'returning', label: 'SIGN IN' }].map(({ mode, label }) => (
            <button key={mode}
              onClick={() => { setAuthMode(mode); setStep('phone'); setError('') }}
              style={{
                flex: 1, padding: '10px', border: 'none',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 1,
                background: authMode === mode ? 'var(--acid)' : 'transparent',
                color: authMode === mode ? 'var(--black)' : 'var(--mid)',
                transition: 'all 0.2s',
              }}
            >{label}</button>
          ))}
        </div>

        {/* Form */}
        {step === 'phone' ? (
          <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card card-top-line" style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input large"
                  type="tel" placeholder="+1 (555) 000-0000"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  required autoFocus inputMode="tel"
                />
              </div>
              {error && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)' }}>{error}</div>}
            </div>
            <button type="submit" className="btn btn-acid btn-full" disabled={loading || !phone.trim()}
              style={{ fontSize: 16, padding: '18px', letterSpacing: 2, borderRadius: 'var(--radius-pill)' }}>
              {loading ? <span className="spinner spinner-sm" /> : (authMode === 'new' ? 'START SETTLING →' : 'SEND CODE')}
            </button>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--mid)', lineHeight: 1.6 }}>
              By continuing, you agree to Settle's Terms of Service.<br />Settle never handles real money.
            </div>
          </form>
        ) : (
          <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card card-top-line" style={{ padding: '20px' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>CHECK YOUR TEXTS</div>
                <div style={{ fontSize: 13, color: 'var(--light)' }}>Code sent to <strong style={{ color: 'var(--white)' }}>{phone}</strong></div>
              </div>
              <div className="form-group">
                <label className="form-label">6-Digit Code</label>
                <input className="otp-input" type="number" placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))}
                  required autoFocus inputMode="numeric" />
              </div>
              {error && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)' }}>{error}</div>}
            </div>
            <button type="submit" className="btn btn-acid btn-full" disabled={loading || otp.length < 6}
              style={{ fontSize: 16, padding: '18px', letterSpacing: 2, borderRadius: 'var(--radius-pill)' }}>
              {loading ? <span className="spinner spinner-sm" /> : 'VERIFY & ENTER →'}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={() => { setStep('phone'); setOtp(''); setError('') }} disabled={loading}>← Change Number</button>
          </form>
        )}
      </section>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)', letterSpacing: 2,
      }}>
        SETTLE. © 2025 — MAKE IT OFFICIAL.
      </div>
    </div>
  )
}
