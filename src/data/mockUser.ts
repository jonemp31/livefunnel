import type { UserProfile } from '../types'

export const mockUser: UserProfile = {
  name: 'Julia 🫦',
  isVerified: true,
  avatarUrl: '/foto1.jpg',
  crowns: 3,
  score: 12_320_238,
  userId: '66668888',
  gender: 'male',
  age: 18,
  isLive: true,
  liveRoomLabel: 'Transmitindo agora um vídeo ao vivo.',
  personalityTags: [
    { id: '1', emoji: '💘', label: 'Relação duradoura' },
    { id: '2', label: 'Chefe' },
    { id: '3', label: 'Música' },
    { id: '4', label: 'Futebol' },
  ],
  signature: 'Vivendo a vida como ela é ✨',
  level: 3,
  mediaContent: [
    { id: 'm1', thumbnailUrl: '/11.jpg', isVideo: false },
    { id: 'm2', thumbnailUrl: '/22.jpg', isVideo: false },
    { id: 'm3', thumbnailUrl: '/33.jpg', isVideo: false },
    { id: 'm4', thumbnailUrl: '/44.jpg', isVideo: false },
    { id: 'm5', thumbnailUrl: '/55.jpg', isVideo: false },
    { id: 'm6', thumbnailUrl: '/66.jpg', isVideo: false },
    { id: 'm7', thumbnailUrl: '/77.jpg', isVideo: false },
    { id: 'm8', thumbnailUrl: '/88.jpg', isVideo: false },
    { id: 'm9', thumbnailUrl: '/99.jpg', isVideo: false },
  ],
}
