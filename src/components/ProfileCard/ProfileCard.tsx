import type { UserProfile } from '../../types'
import ProfileHero from './ProfileHero'
import UserHeader from './UserHeader'
import UserBadges from './UserBadges'
import UserMeta from './UserMeta'
import AudioRoomBanner from './AudioRoomBanner'
import SalesText from './SalesText'
import LevelBadge from './LevelBadge'
import MediaGrid from './MediaGrid'
import './ProfileCard.css'

interface ProfileCardProps {
  user: UserProfile
}

export default function ProfileCard({ user }: ProfileCardProps) {
  return (
    <article className="profile-card" role="region" aria-label={`Perfil de ${user.name}`}>
      {/* ── Hero Image ── */}
      <ProfileHero imageUrl={user.avatarUrl} name={user.name} />

      {/* ── Glassmorphism Info Panel ── */}
      <div className="profile-card__panel">
        {/* Level badge floating */}
        <LevelBadge level={user.level} />

        <div className="profile-card__content">
          <UserHeader name={user.name} isVerified={user.isVerified} />
          <UserBadges crowns={user.crowns} score={user.score} />
          <UserMeta userId={user.userId} gender={user.gender} age={user.age} />

          {user.isLive && (
            <AudioRoomBanner label={user.liveRoomLabel} />
          )}

          <SalesText name="Julia" age={22} />

          {user.mediaContent?.length > 0 && (
            <MediaGrid items={user.mediaContent} title="Mídias" />
          )}
        </div>
      </div>
    </article>
  )
}
