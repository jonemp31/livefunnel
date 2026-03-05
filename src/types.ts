/* ── Types shared across components ── */

export interface UserProfile {
  name: string
  isVerified: boolean
  avatarUrl: string
  crowns: number
  score: number
  userId: string
  gender: 'male' | 'female' | 'other'
  age: number
  isLive: boolean
  liveRoomLabel?: string
  personalityTags: PersonalityTag[]
  signature?: string
  level: number
  mediaContent: MediaItem[]
}

export interface PersonalityTag {
  id: string
  emoji?: string
  label: string
}

export interface MediaItem {
  id: string
  thumbnailUrl?: string
  videoUrl?: string
  alt?: string
  isVideo?: boolean
}
