import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Landing from './pages/Landing.jsx'
import Onboard from './pages/Onboard.jsx'
import Feed from './pages/Feed.jsx'
import CreateBet from './pages/CreateBet.jsx'
import BetDetail from './pages/BetDetail.jsx'
import Profile from './pages/Profile.jsx'
import AcceptBet from './pages/AcceptBet.jsx'
import Friends from './pages/Friends.jsx'
import Groups from './pages/Groups.jsx'
import JoinGroup from './pages/JoinGroup.jsx'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">SETTLE<span>.</span></div>
      <div className="spinner" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { session, loading, isOnboarded } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/" replace />
  if (!isOnboarded) return <Navigate to="/onboard" replace />
  return children
}

function LandingRoute() {
  const { session, loading, isOnboarded } = useAuth()

  if (loading) return <LoadingScreen />
  if (session && isOnboarded) return <Navigate to="/feed" replace />
  if (session && !isOnboarded) return <Navigate to="/onboard" replace />
  return <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / landing (unauthenticated) */}
        <Route path="/" element={<LandingRoute />} />

        {/* Legacy /auth redirect */}
        <Route path="/auth" element={<Navigate to="/" replace />} />

        {/* Accept bet invite (public) */}
        <Route path="/accept/:token" element={<AcceptBet />} />

        {/* Join group invite (public) */}
        <Route path="/join-group/:code" element={<JoinGroup />} />

        {/* Onboarding */}
        <Route path="/onboard" element={<Onboard />} />

        {/* Protected app */}
        <Route path="/feed"    element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/create"  element={<ProtectedRoute><CreateBet /></ProtectedRoute>} />
        <Route path="/bet/:id" element={<ProtectedRoute><BetDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/groups"  element={<ProtectedRoute><Groups /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
