import './UserHeader.css'

interface UserHeaderProps {
  name: string
  isVerified: boolean
}

export default function UserHeader({ name, isVerified }: UserHeaderProps) {
  return (
    <div className="user-header">
      <h1 className="user-header__name">{name}</h1>
      {isVerified && (
        <span className="user-header__badge" title="Verificado" aria-label="Conta verificada">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="url(#verify-gradient)" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="verify-gradient" x1="4" y1="4" x2="20" y2="20">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      )}
    </div>
  )
}
