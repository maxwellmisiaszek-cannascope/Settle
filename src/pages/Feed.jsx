import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'
import Nav from '../components/Nav.jsx'
import BetCard from '../components/BetCard.jsx'

const FILTERS = ['all', 'active', 'pending', 'settled']

export default function Feed() {
  const { user, profile } = useAuth()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    fetchBets()

    // Realtime subscription
    const channel = supabase
      .channel('feed-bets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bets',
        filter: `created_by=eq.${user.id}`,
      }, () => fetchBets())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bets',
        filter: `challenged_user=eq.${user.id}`,
      }, () => fetchBets())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchBets() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          challenger_profile:profiles!bets_created_by_fkey(id, display_name, avatar_emoji),
          challenged_profile:profiles!bets_challenged_user_fkey(id, display_name, avatar_emoji)
        `)
        .or(`created_by.eq.${user.id},challenged_user.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBets(data || [])
    } catch (err) {
      console.error('Error fetching bets:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? bets : bets.filter(b => {
    if (filter === 'settled') return b.status === 'settled'
    if (filter === 'active') return b.status === 'active' || b.status === 'resolving'
    if (filter === 'pending') return b.status === 'pending'
    return true
  })

  const activeBets = bets.filter(b => b.status === 'active' || b.status === 'resolving').length
  const pendingBets = bets.filter(b => b.status === 'pending').length

  return (
    <>
      <Nav />
      <div className="page">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1, lineHeight: 0.95, marginBottom: 8 }}>
            YOUR<br />
            <span style={{ color: 'var(--acid)' }}>BETS</span>
          </div>

          {/* Score pill */}
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)',
                borderRadius: 'var(--radius-pill)', padding: '6px 14px',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--acid)', letterSpacing: 1 }}>
                  {profile.settle_score}
                </span>
                <span className="label">SETTLE SCORE</span>
              </div>
              {activeBets > 0 && (
                <span className="badge badge-active">
                  <span className="badge-dot" />
                  {activeBets} ACTIVE
                </span>
              )}
              {pendingBets > 0 && (
                <span className="badge badge-pending">
                  <span className="badge-dot" />
                  {pendingBets} PENDING
                </span>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${filter === f ? 'var(--acid)' : 'var(--border)'}`,
                background: filter === f ? 'rgba(200,255,0,0.1)' : 'var(--gray)',
                color: filter === f ? 'var(--acid)' : 'var(--light)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Bet list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🎲</div>
            <div className="empty-title">NO BETS YET</div>
            <div className="empty-desc">
              {filter === 'all'
                ? 'Make your first bet. Put your money where your mouth is.'
                : `No ${filter} bets right now.`}
            </div>
            {filter === 'all' && (
              <Link to="/create" className="btn btn-acid" style={{ marginTop: 8 }}>
                + NEW BET
              </Link>
            )}
          </div>
        ) : (
          <div>
            {filtered.map(bet => (
              <BetCard key={bet.id} bet={bet} currentUserId={user.id} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
