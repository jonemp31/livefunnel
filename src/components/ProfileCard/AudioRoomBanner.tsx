import './AudioRoomBanner.css'

interface AudioRoomBannerProps {
  label?: string
  onClick?: () => void
}

export default function AudioRoomBanner({ label, onClick }: AudioRoomBannerProps) {
  return (
    <div className="audio-room-banner">
      <div className="audio-room-banner__left">
        <span className="audio-room-banner__pulse" aria-hidden="true" />
        <span className="audio-room-banner__text">
          {label || 'Transmitindo em uma sala de áudio.'}
        </span>
      </div>
      <button className="audio-room-banner__btn" type="button" onClick={onClick}>
        Entrar
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
