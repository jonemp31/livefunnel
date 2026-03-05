import './UserBadges.css'

interface UserBadgesProps {
  crowns: number
  score: number
}

export default function UserBadges({ crowns, score }: UserBadgesProps) {
  return (
    <div className="user-badges">
      <div className="user-badges__crowns" aria-label={`${crowns} coroas`}>
        {Array.from({ length: crowns }, (_, i) => (
          <span key={i} className="user-badges__crown" style={{ animationDelay: `${i * 0.1}s` }}>
            👑
          </span>
        ))}
      </div>
      <span className="user-badges__score">
        {score.toLocaleString('pt-BR')}
      </span>
      <span className="user-badges__score-icon" title="Pontuação">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="var(--color-text-muted)" strokeWidth="1.5" />
          <text x="12" y="16" textAnchor="middle" fill="var(--color-text-muted)" fontSize="12" fontWeight="600">?</text>
        </svg>
      </span>
    </div>
  )
}
