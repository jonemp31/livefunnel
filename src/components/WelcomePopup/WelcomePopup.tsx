import { useState } from 'react'
import './WelcomePopup.css'

interface WelcomePopupProps {
  avatarUrl: string
  name: string
  title?: string
  buttonText?: string
  showClose?: boolean
  pulseBtn?: boolean
  smallBtn?: boolean
  subCta?: string
  onClose: () => void
  onDismiss?: () => void
}

export default function WelcomePopup({
  avatarUrl,
  name,
  title,
  buttonText = 'SIM!',
  showClose = false,
  pulseBtn = false,
  smallBtn = false,
  subCta,
  onClose,
  onDismiss,
}: WelcomePopupProps) {
  const [closing, setClosing] = useState(false)

  const handleClick = () => {
    setClosing(true)
    setTimeout(onClose, 300)
  }

  const handleDismiss = () => {
    setClosing(true)
    setTimeout(() => {
      if (onDismiss) onDismiss()
      else onClose()
    }, 300)
  }

  return (
    <div className={`popup-overlay ${closing ? 'popup-overlay--closing' : ''}`}>
      <div
        className={`popup ${closing ? 'popup--closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {showClose && (
          <button className="popup__close" type="button" onClick={handleDismiss} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {/* Avatar */}
        <div className="popup__avatar-wrapper">
          <img
            className="popup__avatar"
            src={avatarUrl}
            alt={`Foto de ${name}`}
          />
          <span className="popup__online-dot" aria-hidden="true" />
        </div>

        {/* Online status */}
        <div className="popup__status">
          <span className="popup__status-dot" aria-hidden="true" />
          <span className="popup__status-text">
            <strong>{name}</strong> está online agora...
          </span>
        </div>

        {/* Title */}
        <h2 className="popup__title">
          {title || (<>Amor, estou online agora...<br />Quer conversar comigo?</>)}
        </h2>

        {/* CTA Button */}
        <button className={`popup__btn${pulseBtn ? ' popup__btn--pulse' : ''}${smallBtn ? ' popup__btn--small' : ''}`} type="button" onClick={handleClick}>
          {buttonText}
        </button>

        {/* Sub-CTA text */}
        {subCta && (
          <span className="popup__status-text popup__sub-cta">
            {subCta}
          </span>
        )}
      </div>
    </div>
  )
}
