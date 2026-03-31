import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function StatusBadge({ status, winnerId, userId }) {
  if (status === 'settled') {
    const won = winnerId === userId
    return (
      <span className={`badge ${won ? 'badge-won' : 'badge-lost'}`}>
        <span className="badge-dot" />
        {won ? 'WON' : 'LOST'}
      </span>
    )
  }
  const map = {
    pending: 'PENDING',
    active: 'ACTIVE',
    resolving: 'RESOLVING',
    cancelled: 'CANCELLED',
    disputed: 'DISPUTED',
  }
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {map[status] || status.toUpperCase()}
    </span>
  )
}

export default function BetCard({ bet, currentUserId }) {
  const isChallenger = bet.created_by === currentUserId
  const myProfile = isChallenger ? bet.challenger_profile : bet.challenged_profile
  const theirProfile = isChallenger ? bet.challenged_profile : bet.challenger_profile

  const myName = myProfile?.display_name || 'You'
  const myEmoji = myProfile?.avatar_emoji || '🎲'
  const theirName = theirProfile?.display_name || (bet.challenged_phone ? `+${bet.challenged_phone.slice(-4)}` : '???')
  const theirEmoji = theirProfile?.avatar_emoji || '❓'

  return (
    <Link to={`/bet/${bet.id}`} className="bet-card bet-card-top-line" style={{ marginBottom: 12 }}>
      {/* Parties */}
      <div className="bet-parties">
        <div className="bet-party">
          <div className="avatar" style={{ fontSize: 18, background: '#2a2a2a' }}>{myEmoji}</div>
          <div>
            <div className="bet-party-name">{myName}</div>
            <div className="bet-party-tag">YOU</div>
          </div>
        </div>

        <div className="vs-badge">VS</div>

        <div className="bet-party" style={{ flexDirection: 'row-reverse' }}>
          <div className="avatar" style={{ fontSize: 18, background: '#2a2a2a' }}>{theirEmoji}</div>
          <div style={{ textAlign: 'right' }}>
            <div className="bet-party-name">{theirName}</div>
            <div className="bet-party-tag">OPPONENT</div>
          </div>
        </div>
      </div>

      {/* Statement */}
      <div className="bet-statement">"{bet.title}"</div>

      {/* Footer */}
      <div className="bet-footer">
        <div>
          <div className="bet-stake-label">STAKE</div>
          <div className="bet-stake">{bet.stake}</div>
        </div>
        <StatusBadge status={bet.status} winnerId={bet.winner_id} userId={currentUserId} />
      </div>
    </Link>
  )
}
