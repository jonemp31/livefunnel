import { useState, useRef, useCallback, useEffect } from 'react'
import './RegisterForm.css'

interface RegisterFormProps {
  onSubmit: (data: { nickname: string; contact: string; birthDate: string }) => void
}

// ── iOS-style Drum Picker Column ──
function DrumColumn({
  items,
  value,
  onChange,
  itemHeight = 40,
  visibleItems = 5,
}: {
  items: string[]
  value: string
  onChange: (val: string) => void
  itemHeight?: number
  visibleItems?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startScroll = useRef(0)
  const velocity = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const animFrame = useRef(0)

  const containerHeight = itemHeight * visibleItems
  const paddingItems = Math.floor(visibleItems / 2)

  const currentIndex = items.indexOf(value)
  const targetScroll = currentIndex * itemHeight

  // Snap to nearest item
  const snapTo = useCallback(
    (scrollPos: number) => {
      const idx = Math.round(scrollPos / itemHeight)
      const clamped = Math.max(0, Math.min(items.length - 1, idx))
      if (containerRef.current) {
        containerRef.current.scrollTop = clamped * itemHeight
      }
      onChange(items[clamped])
    },
    [items, itemHeight, onChange],
  )

  // Momentum scrolling
  const decelerate = useCallback(() => {
    if (!containerRef.current) return
    if (Math.abs(velocity.current) < 0.5) {
      snapTo(containerRef.current.scrollTop)
      return
    }
    velocity.current *= 0.92
    containerRef.current.scrollTop += velocity.current
    animFrame.current = requestAnimationFrame(decelerate)
  }, [snapTo])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = targetScroll
    }
  }, [targetScroll])

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    startY.current = e.clientY
    startScroll.current = containerRef.current?.scrollTop ?? 0
    velocity.current = 0
    lastY.current = e.clientY
    lastTime.current = Date.now()
    cancelAnimationFrame(animFrame.current)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const diff = startY.current - e.clientY
    containerRef.current.scrollTop = startScroll.current + diff

    const now = Date.now()
    const dt = now - lastTime.current
    if (dt > 0) {
      velocity.current = (lastY.current - e.clientY) / dt * 16
    }
    lastY.current = e.clientY
    lastTime.current = now
  }

  const handlePointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    if (Math.abs(velocity.current) > 1) {
      animFrame.current = requestAnimationFrame(decelerate)
    } else {
      snapTo(containerRef.current?.scrollTop ?? 0)
    }
  }

  return (
    <div className="drum-col-wrapper" style={{ height: containerHeight }}>
      <div className="drum-col-highlight" style={{ height: itemHeight, top: `${paddingItems * itemHeight}px` }} />
      <div className="drum-col-fade drum-col-fade--top" style={{ height: paddingItems * itemHeight }} />
      <div className="drum-col-fade drum-col-fade--bottom" style={{ height: paddingItems * itemHeight }} />
      <div
        ref={containerRef}
        className="drum-col-scroll"
        style={{ height: containerHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Top padding */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`pt-${i}`} className="drum-col-item drum-col-item--empty" style={{ height: itemHeight }} />
        ))}
        {items.map((item, i) => {
          const isSelected = i === currentIndex
          return (
            <div
              key={item}
              className={`drum-col-item ${isSelected ? 'drum-col-item--selected' : ''}`}
              style={{ height: itemHeight, lineHeight: `${itemHeight}px` }}
              onClick={() => {
                onChange(item)
                if (containerRef.current) {
                  containerRef.current.scrollTo({ top: i * itemHeight, behavior: 'smooth' })
                }
              }}
            >
              {item}
            </div>
          )
        })}
        {/* Bottom padding */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`pb-${i}`} className="drum-col-item drum-col-item--empty" style={{ height: itemHeight }} />
        ))}
      </div>
    </div>
  )
}

// Generate data
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 80 }, (_, i) => String(currentYear - 18 - i))

// ── Phone mask: +55 (DD) 9XXXX-XXXX ──
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // always prefix with 55
  const d = digits.startsWith('55') ? digits : '55' + digits
  let out = '+' + d.slice(0, 2) // +55
  if (d.length > 2) out += ' (' + d.slice(2, 4) // (DD
  if (d.length > 4) out += ') ' + d.slice(4, 9) // ) 9XXXX
  if (d.length > 9) out += '-' + d.slice(9, 13) // -XXXX
  return out
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

export default function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [nickname, setNickname] = useState('')
  const [contact, setContact] = useState('')
  const [contactMode, setContactMode] = useState<'none' | 'phone' | 'email'>('none')
  const [day, setDay] = useState('15')
  const [month, setMonth] = useState('Jun')
  const [year, setYear] = useState('2000')
  const [error, setError] = useState('')
  const [underageBlock, setUnderageBlock] = useState(false)
  const [closing, setClosing] = useState(false)
  const [bgVideoEnded, setBgVideoEnded] = useState(false)
  const bgVideoRef = useRef<HTMLVideoElement>(null)

  // Auto-detect mode & apply mask
  const handleContactChange = (raw: string) => {
    setError('')
    // If starts with digit or +, treat as phone
    if (/^[\d+]/.test(raw.replace(/\s/g, ''))) {
      setContactMode('phone')
      setContact(formatPhone(raw))
    } else if (raw.includes('@') || contactMode === 'email') {
      setContactMode('email')
      setContact(raw)
    } else {
      // Not yet determined
      setContactMode('none')
      setContact(raw)
    }
  }

  const handleSubmit = () => {
    if (!nickname.trim()) {
      setError('Digite seu nickname')
      return
    }
    if (!contact.trim()) {
      setError('Digite seu e-mail ou WhatsApp')
      return
    }
    // Validate contact
    if (contactMode === 'phone') {
      const digits = contact.replace(/\D/g, '')
      if (digits.length < 12) {
        setError('Digite um número de telefone válido')
        return
      }
    } else if (contactMode === 'email' || contact.includes('@')) {
      if (!isValidEmail(contact.trim())) {
        setError('Digite um e-mail válido')
        return
      }
    } else {
      setError('Digite um e-mail ou número de WhatsApp')
      return
    }

    // Age check — must be 18+
    const monthIndex = MONTHS.indexOf(month) + 1
    const birthDate = new Date(Number(year), monthIndex - 1, Number(day))
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) {
      setUnderageBlock(true)
      return
    }

    const birthStr = `${day}/${String(monthIndex).padStart(2, '0')}/${year}`
    setClosing(true)
    setTimeout(() => {
      onSubmit({ nickname: nickname.trim(), contact: contact.trim(), birthDate: birthStr })
    }, 300)
  }

  return (
    <div className={`reg-overlay ${closing ? 'reg-overlay--closing' : ''}`}>
      {/* Background teaser video */}
      <video
        ref={bgVideoRef}
        className={`reg-bg-video ${bgVideoEnded ? 'reg-bg-video--ended' : ''}`}
        src="/videocriarperfilparaentrar.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setBgVideoEnded(true)}
      />
      <div className={`reg-bg-scrim ${bgVideoEnded ? 'reg-bg-scrim--ended' : ''}`} />

      <div className={`reg-card ${closing ? 'reg-card--closing' : ''}`}>
        <div className="reg-header">
          <h2 className="reg-title">Criar perfil para entrar</h2>
          <p className="reg-subtitle">Preencha para acessar a sala ao vivo</p>
        </div>

        <div className="reg-fields">
          <div className="reg-field">
            <label className="reg-label">Nickname</label>
            <input
              className="reg-input"
              type="text"
              placeholder="Seu apelido na live"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setError('') }}
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="reg-field">
            <label className="reg-label">E-mail ou WhatsApp</label>
            <input
              className="reg-input"
              type={contactMode === 'email' ? 'email' : 'tel'}
              inputMode={contactMode === 'phone' ? 'tel' : contactMode === 'email' ? 'email' : 'text'}
              placeholder="email@exemplo.com ou (11) 99999-9999"
              value={contact}
              onChange={e => handleContactChange(e.target.value)}
              maxLength={contactMode === 'phone' ? 22 : 50}
            />
          </div>

          <div className="reg-field">
            <label className="reg-label">Data de Nascimento</label>
            <div className="reg-drum-picker">
              <DrumColumn items={DAYS} value={day} onChange={setDay} />
              <DrumColumn items={MONTHS} value={month} onChange={setMonth} />
              <DrumColumn items={YEARS} value={year} onChange={setYear} />
            </div>
          </div>
        </div>

        {error && <p className="reg-error">{error}</p>}

        <button className="reg-btn" onClick={handleSubmit}>
          <span>Entrar na sala</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Underage block overlay */}
      {underageBlock && (
        <div className="reg-underage-overlay">
          <div className="reg-underage-card">
            <button className="reg-underage-close" onClick={() => setUnderageBlock(false)} title="Fechar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="reg-underage-icon">🔞</div>
            <h2 className="reg-underage-title">Acesso Negado</h2>
            <p className="reg-underage-msg">
              É proibido o acesso a live por menores de 18 anos!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
