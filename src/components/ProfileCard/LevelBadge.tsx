import './LevelBadge.css'

interface LevelBadgeProps {
  level: number
}

export default function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <div className="level-badge" title={`Nível ${level}`}>
      <div className="level-badge__inner">
        <span className="level-badge__crown" aria-hidden="true">👑</span>
        <span className="level-badge__number">{level}<sup>+</sup></span>
      </div>
    </div>
  )
}
