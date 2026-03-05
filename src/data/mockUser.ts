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
    { id: 'm1', videoUrl: '/1.mp4', isVideo: true },
    { id: 'm2', videoUrl: '/2.mp4', isVideo: true },
    { id: 'm3', videoUrl: '/3.mp4', isVideo: true },
    { id: 'm4', videoUrl: '/4.mp4', isVideo: true },
    { id: 'm5', videoUrl: '/5.mp4', isVideo: true },
    { id: 'm6', videoUrl: '/6.mp4', isVideo: true },
    { id: 'm7', videoUrl: '/7.mp4', isVideo: true },
    { id: 'm8', videoUrl: '/8.mp4', isVideo: true },
    { id: 'm9', videoUrl: '/9.mp4', isVideo: true },
  ],
}
