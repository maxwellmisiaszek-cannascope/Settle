import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ── Animated ticker items ──────────────────────────────────────────────
const TICKER_ITEMS = [
  '"You owe me $20"', '"I told you so"', '"Loser buys dinner"',
  '"Next round\'s on you"', '"I bet you can\'t"', '"Put your money where your mouth is"',
  '"Pay up"', '"I knew it"', '"Official record, no excuses"',
]

function Ticker() {
  return (
    <div style={{ overflow: 'hidden', position: 'relative', margin: '0 -20px' }}>
      <div style={{
        display: 'flex', gap: 32, whiteSpace: 'nowrap',
        animation: 'tickerScroll 28s linear infinite',
        paddingLeft: '100%',
      }}>
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} style={{
            fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 2,
            color: i % 3 === 0 ? 'var(--acid)' : 'var(--mid)',
            flexShrink: 0,
          }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Animated score ring ────────────────────────────────────────────────
function ScoreRing({ score = 850, label = 'LEGENDARY' }) {
  const pct = score / 1000
  const r = 36
  const circ = 2 * Math.PI * r
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 92, height: 92 }}>
        <svg width="92" height="92" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="46" cy="46" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="46" cy="46" r={r} fill="none" stroke="var(--acid)" strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 8, color: 'var(--mid)', letterSpacing: 1, marginTop: 2 }}>SCORE</div>
        </div>
      </div>
      <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--acid)', fontFamily: 'var(--font-display)' }}>
        {label}
      </div>
    </div>
  )
}

// ── Feature card ────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0, visible }) {
  return (
    <div style={{
      padding: '20px 18px', background: 'var(--gray)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 1, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--light)', lineHeight: 1.6 }}>{desc}</div>
    </div>
  )
}

// ── Testimonial card ────────────────────────────────────────────────────
function TestimonialCard({ emoji, name, text, visible, delay = 0 }) {
  return (
    <div style={{
      padding: '18px', background: 'var(--gray)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, background: 'var(--black)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          border: '2px solid var(--border)',
        }}>{emoji}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 1 }}>{name}</div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--light)', lineHeight: 1.7 }}>"{text}"</div>
    </div>
  )
}

// ── Section observer hook ───────────────────────────────────────────────
function useVisible(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { session } = useAuth()

  // Auth state
  const [authMode, setAuthMode] = useState('new') // 'new' | 'returning'
  const [step, setStep] = useState('phone')        // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Section visibility
  const [heroRef, heroVisible] = useVisible(0.1)
  const [featuresRef, featuresVisible] = useVisible(0.1)
  const [scoreRef, scoreVisible] = useVisible(0.1)
  const [socialRef, socialVisible] = useVisible(0.1)
  const [testimonialsRef, testimonialsVisible] = useVisible(0.1)
  const [authRef, authVisible] = useVisible(0.05)

  // If already logged in, redirect
  useEffect(() => {
    if (session) navigate('/feed', { replace: true })
  }, [session, navigate])

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (!digits.startsWith('1') && digits.length === 10) return `+1${digits}`
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
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
        phone, token: otp.trim(), type: 'sms',
      })
      if (error) throw error
      // AuthContext detects session change → redirect happens via useEffect above
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.')
      setLoading(false)
    }
  }

  const authSectionRef = useRef(null)
  function scrollToAuth() {
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 20px 40px',
        position: 'relative',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,255,0,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          textAlign: 'center', marginBottom: 32,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 64,
            letterSpacing: 10, lineHeight: 1,
          }}>
            SETTLE<span style={{ color: 'var(--acid)' }}>.</span>
          </div>
          <div style={{
            fontSize: 13, color: 'var(--mid)', letterSpacing: 4,
            textTransform: 'uppercase', marginTop: 8,
          }}>
            Make it official.
          </div>
        </div>

        {/* Ticker */}
        <div style={{
          marginBottom: 40,
          opacity: heroVisible ? 1 : 0,
          transition: 'opacity 1s ease 0.3s',
        }}>
          <Ticker />
        </div>

        {/* Headline */}
        <div style={{
          textAlign: 'center', marginBottom: 32,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 36,
            letterSpacing: 2, lineHeight: 1.2, marginBottom: 16,
          }}>
            BETS ARE SERIOUS.<br />
            <span style={{ color: 'var(--acid)' }}>NOW THEY'RE OFFICIAL.</span>
          </div>
          <div style={{ fontSize: 15, color: 'var(--light)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
            Settle tracks your bets, protects your reputation, and makes sure nobody ghosts when they lose.
          </div>
        </div>

        {/* CTAs */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s',
        }}>
          <button
            className="btn btn-acid btn-full"
            onClick={() => { setAuthMode('new'); scrollToAuth() }}
            style={{ fontSize: 16, padding: '18px', letterSpacing: 2 }}
          >
            START SETTLING →
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => { setAuthMode('returning'); scrollToAuth() }}
            style={{ fontSize: 13 }}
          >
            Returning settler? Sign in
          </button>
        </div>

        {/* Scroll indicator */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginTop: 48, gap: 6,
          opacity: heroVisible ? 0.4 : 0,
          transition: 'opacity 1s ease 1s',
          animation: heroVisible ? 'bounce 2s ease-in-out infinite 1.5s' : 'none',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--mid)' }}>SCROLL</div>
          <div style={{ fontSize: 18, color: 'var(--mid)' }}>↓</div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef} style={{ padding: '60px 20px' }}>
        <div style={{
          textAlign: 'center', marginBottom: 32,
          opacity: featuresVisible ? 1 : 0,
          transform: featuresVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: 'var(--acid)', marginBottom: 8 }}>HOW IT WORKS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 2 }}>
            SIMPLE. SERIOUS.<br />NO EXCUSES.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FeatureCard
            icon="🤝" title="MAKE THE BET"
            desc="Create a bet with a title, stake, and opponent. Send them a link."
            delay={0} visible={featuresVisible}
          />
          <FeatureCard
            icon="✅" title="ACCEPT & GO LIVE"
            desc="Opponent accepts the bet. It's now official on both your records."
            delay={100} visible={featuresVisible}
          />
          <FeatureCard
            icon="⚖️" title="RESOLVE IT"
            desc="Both vote on who won. Disagree? Bring in a witness or submit evidence."
            delay={200} visible={featuresVisible}
          />
          <FeatureCard
            icon="💸" title="PAY UP OR GET GHOSTED"
            desc="Winner marks paid or ghosted. Your Settle Score tells the world if you're good for it."
            delay={300} visible={featuresVisible}
          />
        </div>
      </section>

      {/* ── SETTLE SCORE ── */}
      <section ref={scoreRef} style={{
        padding: '60px 20px',
        background: 'linear-gradient(180deg, var(--black) 0%, rgba(200,255,0,0.03) 50%, var(--black) 100%)',
      }}>
        <div style={{
          textAlign: 'center', marginBottom: 32,
          opacity: scoreVisible ? 1 : 0,
          transform: scoreVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: 'var(--acid)', marginBottom: 8 }}>YOUR REPUTATION</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 2 }}>
            THE SETTLE SCORE
          </div>
          <div style={{ fontSize: 13, color: 'var(--light)', marginTop: 12, lineHeight: 1.7 }}>
            A live score from 0–1000 that reflects how reliable you are.<br />
            Win bets. Pay up. Build your reputation.
          </div>
        </div>

        {/* Score tiers */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          opacity: scoreVisible ? 1 : 0,
          transition: 'opacity 0.8s ease 0.2s',
        }}>
          {[
            { range: '900–1000', tier: 'LEGENDARY', color: '#FFD700', bar: '100%' },
            { range: '750–899',  tier: 'RELIABLE',  color: 'var(--acid)', bar: '85%' },
            { range: '600–749',  tier: 'SOLID',     color: '#7EB3FF', bar: '65%' },
            { range: '400–599',  tier: 'SHAKY',     color: '#FF9B3D', bar: '45%' },
            { range: '0–399',    tier: 'FLAKY',     color: '#FF3B3B', bar: '25%' },
          ].map(({ range, tier, color, bar }) => (
            <div key={tier} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', background: 'var(--gray)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: scoreVisible ? bar : '0%', background: color,
                    borderRadius: 3, transition: 'width 1s ease 0.4s',
                  }} />
                </div>
              </div>
              <div style={{ width: 80, fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1, color }}>
                {tier}
              </div>
              <div style={{ fontSize: 11, color: 'var(--mid)', minWidth: 60, textAlign: 'right' }}>{range}</div>
            </div>
          ))}
        </div>

        {/* Score rings example */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 32, marginTop: 36,
          opacity: scoreVisible ? 1 : 0,
          transition: 'opacity 0.8s ease 0.5s',
        }}>
          <ScoreRing score={947} label="LEGENDARY" />
          <ScoreRing score={782} label="RELIABLE" />
          <ScoreRing score={521} label="SHAKY" />
        </div>
      </section>

      {/* ── SOCIAL ── */}
      <section ref={socialRef} style={{ padding: '60px 20px' }}>
        <div style={{
          textAlign: 'center', marginBottom: 32,
          opacity: socialVisible ? 1 : 0,
          transform: socialVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: 'var(--acid)', marginBottom: 8 }}>SOCIAL</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 2 }}>
            YOUR CREW.<br />YOUR RECORD.
          </div>
          <div style={{ fontSize: 13, color: 'var(--light)', marginTop: 12, lineHeight: 1.7 }}>
            Add friends, create groups, and keep track of who owes who across your whole circle.
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          opacity: socialVisible ? 1 : 0,
          transform: socialVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
        }}>
          {[
            { icon: '👥', label: 'ADD FRIENDS' },
            { icon: '🏆', label: 'CREATE GROUPS' },
            { icon: '📊', label: 'LEADERBOARDS' },
            { icon: '🔗', label: 'INVITE LINKS' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              padding: '20px 16px', background: 'var(--gray)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 2, color: 'var(--light)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section ref={testimonialsRef} style={{ padding: '60px 20px' }}>
        <div style={{
          textAlign: 'center', marginBottom: 28,
          opacity: testimonialsVisible ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: 'var(--acid)', marginBottom: 8 }}>SETTLERS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 2 }}>THEY SETTLED.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TestimonialCard
            emoji="🔥" name="JAKE M."
            text="My roommate finally paid me back for that football bet. I had the Settle receipt. No arguments."
            visible={testimonialsVisible} delay={0}
          />
          <TestimonialCard
            emoji="💀" name="PRIYA K."
            text="My boyfriend bet me he'd finish a book in a week. He didn't. I have proof. His Settle Score agrees."
            visible={testimonialsVisible} delay={100}
          />
          <TestimonialCard
            emoji="🤑" name="MARCUS T."
            text="Our whole friend group uses it now. Nobody ghosts because everyone can see your score."
            visible={testimonialsVisible} delay={200}
          />
        </div>
      </section>

      {/* ── AUTH ── */}
      <section
        ref={(el) => { authSectionRef.current = el; if (authRef) authRef.current = el }}
        style={{ padding: '60px 20px 80px' }}
      >
        <div style={{
          textAlign: 'center', marginBottom: 32,
          opacity: authVisible ? 1 : 0,
          transform: authVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          {authMode === 'new' ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 2, marginBottom: 8 }}>
                READY TO<br /><span style={{ color: 'var(--acid)' }}>SETTLE?</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--light)' }}>No passwords. Just your phone number.</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 2, marginBottom: 8 }}>
                WELCOME<br /><span style={{ color: 'var(--acid)' }}>BACK.</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--light)' }}>Sign in to your Settle account.</div>
            </>
          )}
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex', background: 'var(--gray)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24,
          opacity: authVisible ? 1 : 0,
          transition: 'opacity 0.6s ease 0.1s',
        }}>
          {[
            { mode: 'new', label: 'NEW SETTLER' },
            { mode: 'returning', label: 'SIGN IN' },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => { setAuthMode(mode); setStep('phone'); setError('') }}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 'calc(var(--radius-md) - 2px)',
                cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1,
                background: authMode === mode ? 'var(--acid)' : 'transparent',
                color: authMode === mode ? 'var(--black)' : 'var(--mid)',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Auth form */}
        <div style={{
          opacity: authVisible ? 1 : 0,
          transform: authVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
        }}>
          {step === 'phone' ? (
            <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card card-top-line">
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
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: 'rgba(255,59,59,0.1)',
                    border: '1px solid rgba(255,59,59,0.25)',
                    borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)',
                  }}>
                    {error}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-acid btn-full"
                disabled={loading || !phone.trim()}
                style={{ fontSize: 15, letterSpacing: 2, padding: '18px' }}
              >
                {loading ? <span className="spinner spinner-sm" /> : (
                  authMode === 'new' ? 'START SETTLING →' : 'SEND CODE'
                )}
              </button>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--mid)', lineHeight: 1.6 }}>
                By continuing you agree to Settle's Terms of Service.
                Settle never handles money.
              </div>
            </form>
          ) : (
            <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card card-top-line">
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 6 }}>
                    CHECK YOUR TEXTS
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--light)' }}>
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
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: 'rgba(255,59,59,0.1)',
                    border: '1px solid rgba(255,59,59,0.25)',
                    borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)',
                  }}>
                    {error}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-acid btn-full"
                disabled={loading || otp.length < 6}
                style={{ fontSize: 15, letterSpacing: 2, padding: '18px' }}
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
      </section>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid var(--border)',
        fontSize: 11, color: 'var(--mid)', letterSpacing: 2,
      }}>
        SETTLE. © 2025 — MAKE IT OFFICIAL.
      </div>
    </div>
  )
}
