import { useRef, useState } from 'react'
import './MediaGrid.css'

interface MediaItem {
  id: string
  thumbnailUrl?: string
  videoUrl?: string
  alt?: string
  isVideo?: boolean
}

interface MediaGridProps {
  items: MediaItem[]
  title?: string
}

export default function MediaGrid({ items, title = 'Conteúdos' }: MediaGridProps) {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [activeId, setActiveId] = useState<string | null>(null)

  if (!items.length) return null

  const playVideo = (id: string) => {
    const video = videoRefs.current.get(id)
    if (video) {
      video.currentTime = 0
      video.play().catch(() => {})
      setActiveId(id)
    }
  }

  const pauseVideo = (id: string) => {
    const video = videoRefs.current.get(id)
    if (video) {
      video.pause()
      video.currentTime = 0
    }
    if (activeId === id) setActiveId(null)
  }

  const handleTouchStart = (id: string) => {
    // If another video is playing, stop it first
    if (activeId && activeId !== id) {
      pauseVideo(activeId)
    }
    playVideo(id)
  }

  const handleTouchEnd = (id: string) => {
    pauseVideo(id)
  }

  return (
    <section className="media-grid">
      <h2 className="media-grid__title">
        <span className="media-grid__icon" aria-hidden="true">🎬</span>
        {title}
      </h2>
      <div className="media-grid__container" role="list">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`media-grid__item${activeId === item.id ? ' media-grid__item--active' : ''}`}
            role="listitem"
            aria-label={item.alt || `Conteúdo ${index + 1}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            type="button"
            onMouseEnter={() => item.videoUrl && playVideo(item.id)}
            onMouseLeave={() => item.videoUrl && pauseVideo(item.id)}
            onTouchStart={() => item.videoUrl && handleTouchStart(item.id)}
            onTouchEnd={() => item.videoUrl && handleTouchEnd(item.id)}
          >
            {item.videoUrl ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(item.id, el)
                }}
                className="media-grid__video"
                src={item.videoUrl}
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                className="media-grid__thumbnail"
                src={item.thumbnailUrl}
                alt={item.alt || `Conteúdo ${index + 1}`}
                loading="lazy"
                decoding="async"
              />
            )}
            {/* Hover overlay */}
            <div className="media-grid__overlay" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            {/* Video indicator */}
            {item.isVideo && (
              <div className="media-grid__video-badge" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
