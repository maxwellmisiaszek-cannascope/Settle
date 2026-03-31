import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Auth from './pages/Auth.jsx'
import Onboard from './pages/Onboard.jsx'
import Feed from './pages/Feed.jsx'
import CreateBet from './pages/CreateBet.jsx'
import BetDetail from './pages/BetDetail.jsx'
import Profile from './pages/Profile.jsx'
import AcceptBet from './pages/AcceptBet.jsx'

function ProtectedRoute({ children }) {
  const { session, loading, isOnboarded } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">SETTLE<span>.</span></div>
        <div className="spinner" />
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />
  if (!isOnboarded) return <Navigate to="/onboard" replace />
  return children
}

function AuthRoute({ children }) {
  const { session, loading, isOnboarded } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">SETTLE<span>.</span></div>
        <div className="spinner" />
      </div>
    )
  }

  if (session && isOnboarded) return <Navigate to="/" replace />
  if (session && !isOnboarded) return <Navigate to="/onboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
        <Route path="/accept/:token" element={<AcceptBet />} />

        {/* Onboarding */}
        <Route path="/onboard" element={<Onboard />} />

        {/* Protected app */}
        <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateBet /></ProtectedRoute>} />
        <Route path="/bet/:id" element={<ProtectedRoute><BetDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
