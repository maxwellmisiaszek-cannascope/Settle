import { useNavigate, useLocation } from 'react-router-dom'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function FriendsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function GroupsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="6" height="14" rx="2" />
      <rect x="9" y="2" width="6" height="19" rx="2" />
      <rect x="16" y="9" width="6" height="12" rx="2" />
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
    { path: '/feed',    label: 'BETS',    icon: <HomeIcon /> },
    { path: '/friends', label: 'FRIENDS', icon: <FriendsIcon /> },
    { path: '/create',  label: 'NEW',     icon: <PlusIcon /> },
    { path: '/groups',  label: 'GROUPS',  icon: <GroupsIcon /> },
    { path: '/profile', label: 'ME',      icon: <UserIcon /> },
  ]

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
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
            <div className="nav-logo" onClick={() => navigate('/feed')} style={{ cursor: 'pointer' }}>
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
