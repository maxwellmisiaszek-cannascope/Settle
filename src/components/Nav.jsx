import { useNavigate, useLocation } from 'react-router-dom'

// Tab bar icons
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function Nav({ title, showBack = false, onBack }) {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'BETS', icon: <HomeIcon /> },
    { path: '/create', label: 'NEW', icon: <PlusIcon /> },
    { path: '/profile', label: 'ME', icon: <UserIcon /> },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Top nav */}
      <nav className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showBack && (
            <button
              onClick={onBack || (() => navigate(-1))}
              style={{
                background: 'var(--gray)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                color: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600,
              }}
            >
              ←
            </button>
          )}
          {title ? (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2 }}>
              {title}
            </div>
          ) : (
            <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              SETTLE<span>.</span>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom tab bar */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.path}
            className={`tab-item ${isActive(tab.path) ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.icon}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
