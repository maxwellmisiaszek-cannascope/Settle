import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'

const GROUP_EMOJIS = ['🏆','🔥','💀','👑','🤝','💸','🎯','⚡','🌪️','🎲','💣','🚀','🎪','🦁','🐉','🤑']

function Avatar({ emoji, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--gray)', border: '2px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, flexShrink: 0,
    }}>
      {emoji || '🎲'}
    </div>
  )
}

function GroupCard({ group, onOpen }) {
  return (
    <button
      onClick={() => onOpen(group)}
      style={{
        width: '100%', textAlign: 'left', background: 'var(--gray)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--acid)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-md)',
        background: 'var(--black)', border: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        flexShrink: 0,
      }}>
        {group.emoji || '🏆'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 1, marginBottom: 2 }}>
          {group.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--mid)' }}>
          {group.member_count} member{group.member_count !== 1 ? 's' : ''}
          {group.active_bets > 0 && <span style={{ color: 'var(--acid)', marginLeft: 8 }}>· {group.active_bets} active</span>}
        </div>
      </div>
      <div style={{ color: 'var(--mid)', fontSize: 18 }}>→</div>
    </button>
  )
}

function GroupDetail({ group, currentUserId, onBack }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteCode] = useState(group.invite_code)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [group.id])

  async function loadMembers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          joined_at,
          profile:profiles(id, display_name, avatar_emoji, settle_score)
        `)
        .eq('group_id', group.id)

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error loading members:', err)
    } finally {
      setLoading(false)
    }
  }

  function copyInvite() {
    const url = `${window.location.origin}/join-group/${inviteCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isAdmin = members.find(m => m.profile?.id === currentUserId)?.role === 'admin'

  return (
    <div className="page">
      <Nav title={group.name} showBack onBack={onBack} />

      {/* Group header */}
      <div className="card card-top-line" style={{ textAlign: 'center', marginBottom: 20, padding: '24px 20px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--radius-lg)',
          background: 'var(--black)', border: '2px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, margin: '0 auto 12px',
        }}>
          {group.emoji}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 2, marginBottom: 4 }}>
          {group.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--mid)' }}>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Invite link */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--mid)', marginBottom: 10 }}>INVITE LINK</div>
        <div className="copy-box" style={{ fontSize: 12 }}>
          {`${window.location.origin}/join-group/${inviteCode}`}
        </div>
        <button
          onClick={copyInvite}
          className="btn btn-acid btn-full"
          style={{ marginTop: 10 }}
        >
          {copied ? 'COPIED!' : 'COPY INVITE LINK'}
        </button>
      </div>

      {/* Members */}
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 2, color: 'var(--mid)' }}>
        MEMBERS ({members.length})
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--mid)', fontSize: 13 }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map((m, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
              <Avatar emoji={m.profile?.avatar_emoji} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1 }}>
                  {m.profile?.display_name}
                  {m.role === 'admin' && (
                    <span style={{
                      marginLeft: 8, fontSize: 9, letterSpacing: 1, color: 'var(--acid)',
                      background: 'rgba(200,255,0,0.1)', padding: '2px 6px',
                      borderRadius: 'var(--radius-pill)', border: '1px solid rgba(200,255,0,0.2)',
                    }}>ADMIN</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mid)' }}>
                  {m.profile?.settle_score ?? 750} pts
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated, friends }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏆')
  const [selectedFriends, setSelectedFriends] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleFriend(id) {
    setSelectedFriends(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  async function create() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      // Create group
      const { data: group, error: groupErr } = await supabase
        .from('groups')
        .insert({ name: name.trim(), emoji, created_by: user.id })
        .select()
        .single()
      if (groupErr) throw groupErr

      // Add creator as admin
      const membersToAdd = [
        { group_id: group.id, user_id: user.id, role: 'admin' },
        ...selectedFriends.map(fid => ({ group_id: group.id, user_id: fid, role: 'member' }))
      ]

      const { error: memberErr } = await supabase
        .from('group_members')
        .insert(membersToAdd)
      if (memberErr) throw memberErr

      onCreated(group)
    } catch (err) {
      setError(err.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
      backdropFilter: 'blur(4px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', background: 'var(--gray)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto',
        animation: 'fadeUp 0.25s ease',
        borderTop: '3px solid var(--acid)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 2, marginBottom: 24 }}>
          CREATE GROUP
        </div>

        {/* Emoji picker */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>GROUP EMOJI</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GROUP_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 44, height: 44, fontSize: 22, background: 'var(--black)',
                  border: `2px solid ${emoji === e ? 'var(--acid)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">GROUP NAME</label>
          <input
            className="form-input large"
            type="text"
            placeholder="The Crew, Office Bets..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            autoFocus
          />
        </div>

        {/* Add friends */}
        {friends.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="form-label" style={{ marginBottom: 10 }}>ADD FRIENDS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {friends.map(f => (
                <label key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: selectedFriends.includes(f.id) ? 'rgba(200,255,0,0.06)' : 'var(--black)',
                  border: `1px solid ${selectedFriends.includes(f.id) ? 'var(--acid)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(f.id)}
                    onChange={() => toggleFriend(f.id)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    border: `2px solid ${selectedFriends.includes(f.id) ? 'var(--acid)' : 'var(--border)'}`,
                    background: selectedFriends.includes(f.id) ? 'var(--acid)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: 'var(--black)', transition: 'all 0.15s',
                    flexShrink: 0,
                  }}>
                    {selectedFriends.includes(f.id) && '✓'}
                  </div>
                  <span style={{ fontSize: 20 }}>{f.avatar_emoji || '🎲'}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 1 }}>
                    {f.display_name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px',
            background: 'rgba(255,59,59,0.1)',
            border: '1px solid rgba(255,59,59,0.25)',
            borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={create}
          className="btn btn-acid btn-full"
          disabled={loading || !name.trim()}
        >
          {loading ? <span className="spinner spinner-sm" /> : `CREATE GROUP${selectedFriends.length > 0 ? ` + ${selectedFriends.length} MEMBER${selectedFriends.length > 1 ? 'S' : ''}` : ''}`}
        </button>
      </div>
    </div>
  )
}

export default function Groups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (user) {
      loadGroups()
      loadFriends()
    }
  }, [user])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function loadGroups() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group:groups(
            id, name, emoji, invite_code, created_by, created_at
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const groupList = (data || []).map(d => d.group).filter(Boolean)

      // Get member counts for each group
      if (groupList.length > 0) {
        const counts = await Promise.all(groupList.map(async g => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id)
          return { id: g.id, count: count ?? 0 }
        }))
        const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]))
        setGroups(groupList.map(g => ({ ...g, member_count: countMap[g.id] ?? 1, active_bets: 0 })))
      } else {
        setGroups([])
      }
    } catch (err) {
      console.error('Error loading groups:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadFriends() {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          requester_id, addressee_id,
          requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_emoji),
          addressee:profiles!friendships_addressee_id_fkey(id, display_name, avatar_emoji)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (error) throw error
      const formatted = (data || []).map(f =>
        f.requester_id === user.id ? f.addressee : f.requester
      ).filter(Boolean)
      setFriends(formatted)
    } catch (err) {
      console.error('Error loading friends:', err)
    }
  }

  function handleGroupCreated(group) {
    showToast('Group created!')
    setShowCreate(false)
    loadGroups()
  }

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        currentUserId={user?.id}
        onBack={() => setSelectedGroup(null)}
      />
    )
  }

  return (
    <div className="page">
      <Nav title="GROUPS" />

      <button
        onClick={() => setShowCreate(true)}
        className="btn btn-acid btn-full"
        style={{ marginBottom: 20, fontSize: 14, letterSpacing: 2 }}
      >
        + CREATE GROUP
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--mid)', fontSize: 13 }}>Loading...</div>
      ) : groups.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1, marginBottom: 8 }}>
            NO GROUPS YET
          </div>
          <div style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.7 }}>
            Create a group for your friend circle, office,<br />or any crew that bets together.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(g => (
            <GroupCard key={g.id} group={g} onOpen={setSelectedGroup} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={handleGroupCreated}
          friends={friends}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
