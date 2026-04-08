import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function JoinGroup() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, session, loading: authLoading } = useAuth()
  const [group, setGroup] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'joined' | 'error' | 'already'
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) fetchGroup()
  }, [code, authLoading])

  useEffect(() => {
    // Once signed in, auto-join
    if (user && group && status === 'ready') {
      handleJoin()
    }
  }, [user, group])

  async function fetchGroup() {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, emoji')
        .eq('invite_code', code)
        .single()

      if (error || !data) {
        setStatus('error')
        setError('Invalid or expired invite link.')
        return
      }

      setGroup(data)

      // Check if already a member
      if (user) {
        const { data: mem } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', data.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (mem) {
          setStatus('already')
          return
        }
      }
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setError('Something went wrong.')
    }
  }

  async function handleJoin() {
    if (!user) {
      // Redirect to landing with a return param
      navigate(`/?join=${code}`)
      return
    }
    try {
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      })
      setStatus('joined')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Failed to join group.')
    }
  }

  if (status === 'loading' || authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">SETTLE<span>.</span></div>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-full" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 6 }}>
          SETTLE<span style={{ color: 'var(--acid)' }}>.</span>
        </div>
      </div>

      {status === 'error' && (
        <div className="card card-top-line" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 8 }}>
            INVALID INVITE
          </div>
          <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 20 }}>{error}</div>
          <button onClick={() => navigate('/')} className="btn btn-ghost btn-full">Go Home</button>
        </div>
      )}

      {status === 'already' && (
        <div className="card card-top-line" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{group?.emoji || '🏆'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 8 }}>
            ALREADY A MEMBER
          </div>
          <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 20 }}>
            You're already in <strong>{group?.name}</strong>.
          </div>
          <button onClick={() => navigate('/groups')} className="btn btn-acid btn-full">VIEW GROUP</button>
        </div>
      )}

      {status === 'joined' && (
        <div className="card card-top-line" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{group?.emoji || '🏆'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 2, color: 'var(--acid)', marginBottom: 8 }}>
            JOINED!
          </div>
          <div style={{ fontSize: 15, marginBottom: 20 }}>
            You're now in <strong>{group?.name}</strong>.
          </div>
          <button onClick={() => navigate('/groups')} className="btn btn-acid btn-full">VIEW GROUP</button>
        </div>
      )}

      {status === 'ready' && group && (
        <div className="card card-top-line" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{group.emoji || '🏆'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 3, color: 'var(--mid)', marginBottom: 6 }}>
            YOU'VE BEEN INVITED TO
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 2, marginBottom: 24 }}>
            {group.name}
          </div>
          {!user ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 20, lineHeight: 1.7 }}>
                Sign in to Settle to join this group.
              </div>
              <button
                onClick={() => navigate(`/?join=${code}`)}
                className="btn btn-acid btn-full"
              >
                SIGN IN TO JOIN
              </button>
            </>
          ) : (
            <button onClick={handleJoin} className="btn btn-acid btn-full" style={{ fontSize: 15, letterSpacing: 2 }}>
              JOIN GROUP →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
