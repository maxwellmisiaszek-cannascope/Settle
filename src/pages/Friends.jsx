import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'

const SCORE_TIERS = [
  { min: 900, label: 'LEGENDARY', color: '#FFD700' },
  { min: 750, label: 'RELIABLE',  color: 'var(--acid)' },
  { min: 600, label: 'SOLID',     color: '#7EB3FF' },
  { min: 400, label: 'SHAKY',     color: '#FF9B3D' },
  { min: 0,   label: 'FLAKY',     color: 'var(--red)' },
]
function getTier(score) {
  return SCORE_TIERS.find(t => score >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1]
}

function Avatar({ emoji, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--gray)', border: '2px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, flexShrink: 0,
    }}>
      {emoji || '🎲'}
    </div>
  )
}

function FriendCard({ friend, onRemove }) {
  const tier = getTier(friend.settle_score ?? 750)
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
      <Avatar emoji={friend.avatar_emoji} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 1, marginBottom: 2 }}>
          {friend.display_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--mid)' }}>
          {friend.settle_score ?? 750} pts ·{' '}
          <span style={{ color: tier.color }}>{tier.label}</span>
        </div>
      </div>
      <button
        onClick={() => onRemove(friend.friendship_id)}
        style={{
          background: 'none', border: 'none', color: 'var(--mid)',
          cursor: 'pointer', fontSize: 18, padding: 4,
        }}
        title="Remove friend"
      >
        ✕
      </button>
    </div>
  )
}

function RequestCard({ request, currentUserId, onAccept, onDecline }) {
  const isIncoming = request.addressee_id === currentUserId
  const otherPerson = isIncoming ? request.requester : request.addressee
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
      <Avatar emoji={otherPerson?.avatar_emoji} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1, marginBottom: 2 }}>
          {otherPerson?.display_name || 'Unknown'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--mid)', letterSpacing: 1 }}>
          {isIncoming ? 'WANTS TO BE FRIENDS' : 'REQUEST SENT'}
        </div>
      </div>
      {isIncoming && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onAccept(request.id)}
            style={{
              background: 'var(--acid)', color: 'var(--black)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              padding: '8px 14px', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 1,
            }}
          >
            ACCEPT
          </button>
          <button
            onClick={() => onDecline(request.id)}
            style={{
              background: 'var(--gray)', color: 'var(--mid)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '8px 12px', cursor: 'pointer', fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default function Friends() {
  const { user } = useAuth()
  const [tab, setTab] = useState('friends') // 'friends' | 'requests' | 'search'
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (user) {
      loadFriends()
      loadRequests()
    }
  }, [user])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function loadFriends() {
    setLoading(true)
    try {
      // Get accepted friendships where user is either requester or addressee
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_emoji, settle_score),
          addressee:profiles!friendships_addressee_id_fkey(id, display_name, avatar_emoji, settle_score)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (error) throw error

      const formatted = (data || []).map(f => {
        const isMeRequester = f.requester_id === user.id
        const friend = isMeRequester ? f.addressee : f.requester
        return { ...friend, friendship_id: f.id }
      })
      setFriends(formatted)
    } catch (err) {
      console.error('Error loading friends:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadRequests() {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_emoji, settle_score),
          addressee:profiles!friendships_addressee_id_fkey(id, display_name, avatar_emoji, settle_score)
        `)
        .eq('status', 'pending')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      console.error('Error loading requests:', err)
    }
  }

  async function searchUsers() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      // Search by display_name or phone (partial match)
      const query = searchQuery.trim().replace(/\D/g, '') || searchQuery.trim()
      const isPhone = /^\d+$/.test(query)

      let q = supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, settle_score, phone')
        .neq('id', user.id)
        .limit(10)

      if (isPhone) {
        q = q.ilike('phone', `%${query}%`)
      } else {
        q = q.ilike('display_name', `%${searchQuery.trim()}%`)
      }

      const { data, error } = await q
      if (error) throw error

      // Check which ones are already friends or have pending requests
      const existing = new Set([
        ...friends.map(f => f.id),
        ...requests.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id),
      ])

      setSearchResults((data || []).map(p => ({
        ...p,
        relationStatus: existing.has(p.id) ? 'exists' : 'none',
      })))
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  async function sendRequest(targetId) {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: user.id, addressee_id: targetId, status: 'pending' })
      if (error) throw error
      showToast('Friend request sent!')
      setSearchResults(prev => prev.map(p => p.id === targetId ? { ...p, relationStatus: 'exists' } : p))
      loadRequests()
    } catch (err) {
      showToast(err.message || 'Failed to send request')
    }
  }

  async function acceptRequest(friendshipId) {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
      if (error) throw error
      showToast('Friend added!')
      loadFriends()
      loadRequests()
    } catch (err) {
      showToast(err.message || 'Failed to accept')
    }
  }

  async function declineRequest(friendshipId) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
      if (error) throw error
      loadRequests()
    } catch (err) {
      showToast(err.message || 'Failed to decline')
    }
  }

  async function removeFriend(friendshipId) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
      if (error) throw error
      showToast('Friend removed')
      loadFriends()
    } catch (err) {
      showToast(err.message || 'Failed to remove')
    }
  }

  const pendingCount = requests.filter(r => r.addressee_id === user?.id).length

  return (
    <div className="page">
      <Nav title="FRIENDS" />

      {/* Tab bar */}
      <div style={{ display: 'flex', background: 'var(--gray)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 20 }}>
        {[
          { key: 'friends', label: `FRIENDS${friends.length ? ` (${friends.length})` : ''}` },
          { key: 'requests', label: `REQUESTS${pendingCount ? ` (${pendingCount})` : ''}` },
          { key: 'search', label: 'ADD' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 6px', border: 'none',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              cursor: 'pointer', fontFamily: 'var(--font-display)',
              fontSize: 11, letterSpacing: 1,
              background: tab === t.key ? 'var(--acid)' : 'transparent',
              color: tab === t.key ? 'var(--black)' : 'var(--mid)',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            {t.label}
            {t.key === 'requests' && pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--red)', display: 'block',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* FRIENDS TAB */}
      {tab === 'friends' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--mid)', fontSize: 13 }}>Loading...</div>
          ) : friends.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1, marginBottom: 8 }}>
                NO FRIENDS YET
              </div>
              <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 20 }}>
                Add friends to track bets and see their Settle Score.
              </div>
              <button
                onClick={() => setTab('search')}
                className="btn btn-acid"
                style={{ width: '100%' }}
              >
                FIND FRIENDS
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {friends.map(f => (
                <FriendCard key={f.id} friend={f} onRemove={removeFriend} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* REQUESTS TAB */}
      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              color: 'var(--mid)', fontSize: 13,
            }}>
              No pending requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Incoming first */}
              {requests.filter(r => r.addressee_id === user.id).length > 0 && (
                <>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--mid)', marginBottom: 4 }}>INCOMING</div>
                  {requests.filter(r => r.addressee_id === user.id).map(r => (
                    <RequestCard key={r.id} request={r} currentUserId={user.id} onAccept={acceptRequest} onDecline={declineRequest} />
                  ))}
                </>
              )}
              {requests.filter(r => r.requester_id === user.id).length > 0 && (
                <>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--mid)', marginTop: 8, marginBottom: 4 }}>SENT</div>
                  {requests.filter(r => r.requester_id === user.id).map(r => (
                    <RequestCard key={r.id} request={r} currentUserId={user.id} onAccept={acceptRequest} onDecline={declineRequest} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* SEARCH / ADD TAB */}
      {tab === 'search' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              className="form-input"
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUsers()}
              style={{ flex: 1 }}
            />
            <button
              onClick={searchUsers}
              className="btn btn-acid"
              disabled={searching || !searchQuery.trim()}
              style={{ flexShrink: 0, padding: '0 18px' }}
            >
              {searching ? <span className="spinner spinner-sm" /> : 'SEARCH'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {searchResults.map(p => (
                <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                  <Avatar emoji={p.avatar_emoji} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 1 }}>
                      {p.display_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mid)' }}>
                      {p.settle_score ?? 750} pts · {getTier(p.settle_score ?? 750).label}
                    </div>
                  </div>
                  {p.relationStatus === 'none' ? (
                    <button
                      onClick={() => sendRequest(p.id)}
                      style={{
                        background: 'var(--acid)', color: 'var(--black)',
                        border: 'none', borderRadius: 'var(--radius-sm)',
                        padding: '8px 14px', cursor: 'pointer',
                        fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1,
                      }}
                    >
                      ADD
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--mid)', letterSpacing: 1 }}>PENDING</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--mid)', fontSize: 13 }}>
              No users found. Try a different name or phone number.
            </div>
          )}

          {!searchQuery && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.7 }}>
                Search by name or phone number<br />to find your friends on Settle.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}
