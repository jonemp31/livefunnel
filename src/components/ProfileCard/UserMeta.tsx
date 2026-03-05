import './UserMeta.css'

interface UserMetaProps {
  userId: string
  gender: 'male' | 'female' | 'other'
  age: number
}

export default function UserMeta({ userId, gender, age }: UserMetaProps) {
  const genderIcon = gender === 'male' ? '♂' : gender === 'female' ? '♀' : '⚧'
  const genderClass = `user-meta__gender user-meta__gender--${gender}`

  return (
    <div className="user-meta">
      <span className="user-meta__id">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="user-meta__id-icon" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        ID:{userId}
      </span>
      <span className={genderClass}>
        {genderIcon} {age}
      </span>
    </div>
  )
}
