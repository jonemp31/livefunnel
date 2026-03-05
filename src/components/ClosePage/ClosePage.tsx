import { useRef, useState, useEffect } from 'react'
import './ClosePage.css'

async function fetchCity(): Promise<string> {
  // 1) Cloudflare trace — works on any CF-proxied domain
  try {
    const res = await fetch('/cdn-cgi/trace')
    if (res.ok) {
      const text = await res.text()
      const ip = text.match(/ip=(.+)/)?.[1]
      if (ip) {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`)
        if (geoRes.ok) {
          const data = await geoRes.json()
          if (data.city && data.region_code) {
            const stateAbbr = getStateAbbr(data.region) || data.region_code
            return `${data.city}/${stateAbbr}`
          }
        }
      }
    }
  } catch { /* fallback */ }
  // 2) ipapi.co direct
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const data = await res.json()
      if (data.city && data.region_code) {
        const stateAbbr = getStateAbbr(data.region) || data.region_code
        return `${data.city}/${stateAbbr}`
      }
    }
  } catch { /* fallback */ }
  // 3) ip-api.com (HTTP, localhost only)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=city,regionName')
    if (res.ok) {
      const data = await res.json()
      if (data.city && data.regionName) {
        const stateAbbr = getStateAbbr(data.regionName) || data.regionName
        return `${data.city}/${stateAbbr}`
      }
    }
  } catch { /* fallback */ }
  return 'Campinas/SP'
}

function getStateAbbr(stateName: string): string | null {
  const states: Record<string, string> = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF',
    'Espírito Santo': 'ES', 'Goiás': 'GO', 'Maranhão': 'MA',
    'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
    'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE',
    'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR',
    'Santa Catarina': 'SC', 'São Paulo': 'SP', 'Sergipe': 'SE',
    'Tocantins': 'TO',
    'Sao Paulo': 'SP', 'Espirito Santo': 'ES', 'Goias': 'GO',
    'Maranhao': 'MA', 'Ceara': 'CE', 'Amapa': 'AP', 'Piaui': 'PI',
    'Paraiba': 'PB', 'Rondonia': 'RO', 'Para': 'PA',
  }
  return states[stateName] || null
}

interface ClosePageProps {
}

const MEDIA_ITEMS = [
  { id: 'c1', videoUrl: '/loira1.mp4' },
  { id: 'c2', videoUrl: '/loira2.mp4' },
  { id: 'c3', videoUrl: '/loira3.mp4' },
  { id: 'c4', videoUrl: '/loira4.mp4' },
  { id: 'c5', videoUrl: '/loira5.mp4' },
  { id: 'c6', videoUrl: '/loira6.mp4' },
]

export default function ClosePage({}: ClosePageProps) {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [showPixPopup, setShowPixPopup] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'simples' | 'vip' | null>(null)
  const [orderBump, setOrderBump] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [pixTimer, setPixTimer] = useState(300)
  const pixTimerStarted = useRef(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [toast, setToast] = useState<{ name: string; visible: boolean } | null>(null)
  const [vagasLeft, setVagasLeft] = useState(17)

  const TOAST_NAMES = [
    'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael',
    'Bruno', 'Felipe', 'Gustavo', 'Thiago', 'Leonardo',
    'André', 'Diego', 'Carlos', 'Eduardo', 'Marcelo',
    'Rodrigo', 'Fernando', 'Vinícius', 'Henrique', 'Renato',
    'Daniel', 'Ricardo', 'Caio', 'João', 'Murilo',
    'Victor', 'Leandro', 'Alex', 'Fábio', 'Guilherme'
  ]

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let usedNames: string[] = []

    const showToast = () => {
      if (usedNames.length >= TOAST_NAMES.length) usedNames = []
      const available = TOAST_NAMES.filter(n => !usedNames.includes(n))
      const name = available[Math.floor(Math.random() * available.length)]
      usedNames.push(name)
      setToast({ name, visible: true })
      setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 4000)
      setTimeout(() => {
        setToast(null)
        timeout = setTimeout(showToast, 8000 + Math.random() * 12000)
      }, 4500)
    }

    timeout = setTimeout(showToast, 60000)
    return () => clearTimeout(timeout)
  }, [])

  /* Vacancy counter - decreases slowly */
  useEffect(() => {
    const iv = setInterval(() => {
      setVagasLeft(prev => {
        if (prev <= 3) return 3
        if (Math.random() < 0.35) return prev - 1
        return prev
      })
    }, 25000 + Math.random() * 20000)
    return () => clearInterval(iv)
  }, [])
  useEffect(() => {
    fetchCity().then(setCity)
    // Meta Pixel: InitiateCheckout on ClosePage
    if (typeof window.fbq === 'function') window.fbq('track', 'InitiateCheckout')
  }, [])

  useEffect(() => {
    if (!showPixPopup || pixTimerStarted.current) return
    pixTimerStarted.current = true
    const iv = setInterval(() => {
      setPixTimer(prev => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(iv)
  }, [showPixPopup])

  const openPix = (plan: 'simples' | 'vip') => {
    setSelectedPlan(plan)
    setOrderBump(false)
    setShowPixPopup(true)
    // Meta Pixel: AddToCart when user selects a plan
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'AddToCart', {
        content_name: plan === 'vip' ? 'Plano VIP' : 'Plano Simples',
        value: plan === 'vip' ? 24.90 : 14.90,
        currency: 'BRL',
      })
    }
  }

  const getTotal = () => {
    const base = selectedPlan === 'vip' ? 24.9 : 14.9
    const bump = orderBump ? 9.9 : 0
    return (base + bump).toFixed(2).replace('.', ',')
  }

  const getPixCode = () => {
    if (selectedPlan === 'vip') {
      return orderBump
        ? '00020126360014BR.GOV.BCB.PIX011440066967000190520400005303986540534.805802BR5901N6001C62240520acessovipcompletoof163042734'
        : '00020126360014BR.GOV.BCB.PIX011440066967000190520400005303986540524.905802BR5901N6001C62210517acessovipcompleto6304F564'
    }
    return orderBump
      ? '00020126360014BR.GOV.BCB.PIX011440066967000190520400005303986540524.805802BR5901N6001C62200516acessosimplesof16304633B'
      : '00020126360014BR.GOV.BCB.PIX011440066967000190520400005303986540514.905802BR5901N6001C62170513acessosimples6304F2EC'
  }

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(getPixCode())
    } catch {
      /* fallback for older browsers */
      const ta = document.createElement('textarea')
      ta.value = getPixCode()
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    // Meta Pixel: Purchase on PIX code copy
    if (typeof window.fbq === 'function') {
      const base = selectedPlan === 'vip' ? 24.90 : 14.90
      const bump = orderBump ? 9.90 : 0
      window.fbq('track', 'Purchase', {
        content_name: selectedPlan === 'vip' ? 'Plano VIP' : 'Plano Simples',
        value: base + bump,
        currency: 'BRL',
      })
    }
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 2500)
    setTimeout(() => {
      window.location.href = 'https://wa.me/5521969617986?text=Oi%20realizei%20a%20compra%20e%20gostaria%20de%20receber%20o%20acesso%20ao%20close%20da%20ju'
    }, 180000)
  }

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
    if (activeId && activeId !== id) pauseVideo(activeId)
    playVideo(id)
  }

  return (
    <div className="close-page">
      {/* Header */}
      <div className="close-page__header">
        <div style={{ width: 20 }} />
        <span className="close-page__title">Close Friends</span>
        <div style={{ width: 20 }} />
      </div>

      {/* Profile section */}
      <div className="close-page__profile">
        <div className="close-page__avatar-ring">
          <img src="/foto1.jpg" alt="Julia" className="close-page__avatar" />
        </div>
        <h1 className="close-page__name">Julia 🫦😏</h1>
        <p className="close-page__subtitle">Close Friends · Lives Privadas · Conteúdos +18</p>
        <div className="close-page__stats">
          <div className="close-page__stat">
            <span className="close-page__stat-value">205</span>
            <span className="close-page__stat-label">Mídias</span>
          </div>
          <div className="close-page__stat">
            <span className="close-page__stat-value">184</span>
            <span className="close-page__stat-label">Membros</span>
          </div>
          <div className="close-page__stat">
            <span className="close-page__stat-value">❤️</span>
            <span className="close-page__stat-label">50.5k</span>
          </div>
        </div>
        <p className="close-page__bio">
          Oi amor, meu nome é Julia e tenho 22 aninhos. Faço faculdade em {city || 'Campinas/SP'} e sou a loirinha com os peitos e a bunda mais gostosos que você já viu 😈🔥 <strong>Aqui tem putaria explícita, sem censura, com vídeos quentes sozinha e com convidados…</strong> Muito sexo, muitas gozadas e zero enrolação. Entra se tiver coragem! Vem ser feliz, vem? 🙈
        </p>
      </div>

      {/* CTA */}
      <div className="close-page__cta-section">
        <button className="close-page__cta-btn" onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}>
          Assinar Close Friends 🔓
        </button>
        <p className="close-page__cta-sub">Acesso a lives privadas e conteúdos exclusivos</p>
      </div>

      {/* Grid */}
      <div className="close-page__grid-section">
        <h2 className="close-page__grid-title">
          <span>🎬</span> Prévia dos Conteúdos
        </h2>
        <div className="close-page__grid">
          {MEDIA_ITEMS.map((item, i) => (
            <button
              key={item.id}
              className={`close-page__grid-item${activeId === item.id ? ' close-page__grid-item--active' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
              onMouseEnter={() => playVideo(item.id)}
              onMouseLeave={() => pauseVideo(item.id)}
              onTouchStart={() => handleTouchStart(item.id)}
              onTouchEnd={() => pauseVideo(item.id)}
            >
              <video
                ref={(el) => { if (el) videoRefs.current.set(item.id, el) }}
                className="close-page__grid-video"
                src={item.videoUrl}
                muted
                loop
                playsInline
                preload="metadata"
              />
              <div className="close-page__grid-overlay">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <div className="close-page__grid-lock">🔒</div>
            </button>
          ))}
        </div>
      </div>

      {/* Vacancy counter */}
      <div className="close-page__vagas">
        <div className="close-page__vagas-inner">
          <span className="close-page__vagas-pulse"></span>
          <p className="close-page__vagas-text">
            🚨 Restam apenas <strong>{vagasLeft} vagas</strong> para o Close Friends
          </p>
        </div>
      </div>

      {/* Offer section */}
      <div className="close-page__offer" id="planos">
        <h2 className="close-page__offer-title">Escolha seu plano 🔓</h2>
        <div className="close-page__plans">
          {/* Acesso Simples */}
          <div className="close-page__plan">
            <div className="close-page__plan-header">
              <span className="close-page__plan-icon">🔥</span>
              <h3 className="close-page__plan-name">Acesso Simples</h3>
            </div>
            <ul className="close-page__plan-list">
              <li>✅ Acesso a 50 mídias exclusivas</li>
              <li>✅ Vídeos novos toda semana</li>
              <li>✅ Conteúdos solo</li>
              <li>❌ Lives privadas</li>
              <li>❌ WhatsApp privado</li>
              <li>❌ Acesso vitalício</li>
            </ul>
            <div className="close-page__plan-price">
              <div className="close-page__price-old">De <s>R$ 49,90</s></div>
              <div className="close-page__price-new">
                <span className="close-page__price-currency">R$</span>
                <span className="close-page__price-value">14</span>
                <span className="close-page__price-cents">,90</span>
              </div>
              <div className="close-page__price-info">Pagamento único</div>
            </div>
            <button className="close-page__plan-btn close-page__plan-btn--simple" onClick={() => openPix('simples')}>
              Quero esse 🔓
            </button>
          </div>

          {/* Acesso VIP Completo */}
          <div className="close-page__plan close-page__plan--vip">
            <div className="close-page__plan-badge">⭐ MAIS POPULAR</div>
            <div className="close-page__plan-header">
              <span className="close-page__plan-icon">👑</span>
              <h3 className="close-page__plan-name">Acesso VIP Completo</h3>
            </div>
            <ul className="close-page__plan-list">
              <li>✅ Acesso a todas as 205 mídias</li>
              <li>✅ Vídeos novos toda semana</li>
              <li>✅ Conteúdos solo e com convidados</li>
              <li>✅ Lives privadas sem censura</li>
              <li>✅ WhatsApp privado direto comigo</li>
              <li>✅ Acesso vitalício ao grupo VIP</li>
            </ul>
            <div className="close-page__plan-price">
              <div className="close-page__price-old">De <s>R$ 97,00</s></div>
              <div className="close-page__price-new close-page__price-new--vip">
                <span className="close-page__price-currency">R$</span>
                <span className="close-page__price-value">24</span>
                <span className="close-page__price-cents">,90</span>
              </div>
              <div className="close-page__price-info">Pagamento único · Acesso imediato</div>
            </div>
            <button className="close-page__plan-btn close-page__plan-btn--vip" onClick={() => openPix('vip')}>
              Quero Entrar Agora 🔥
            </button>
          </div>
        </div>
        <p className="close-page__offer-guarantee">🔒 Pagamento seguro · Satisfação garantida</p>
      </div>

      {/* Depoimentos */}
      <div className="close-page__testimonials">
        <h2 className="close-page__testimonials-title">O que os assinantes dizem 💬</h2>
        <div className="close-page__testimonials-list">
          <div className="close-page__testimonial">
            <div className="close-page__testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="close-page__testimonial-text">“Melhor investimento que já fiz. Conteúdo muito acima do que eu esperava, e ainda recebi acesso ao WhatsApp dela.”</p>
            <span className="close-page__testimonial-name">Lucas M.</span>
          </div>
          <div className="close-page__testimonial">
            <div className="close-page__testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="close-page__testimonial-text">“Pensei que fosse golpe, mas recebi o acesso na hora. Os vídeos são incríveis e ela posta toda semana.”</p>
            <span className="close-page__testimonial-name">Rafael S.</span>
          </div>
          <div className="close-page__testimonial">
            <div className="close-page__testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="close-page__testimonial-text">“As lives privadas são de outro nível. Vale muito a pena, principalmente o plano VIP.”</p>
            <span className="close-page__testimonial-name">Gustavo R.</span>
          </div>
        </div>
      </div>

      {/* Garantia */}
      <div className="close-page__guarantee">
        <div className="close-page__guarantee-inner">
          <span className="close-page__guarantee-icon">🛡️</span>
          <h3 className="close-page__guarantee-title">Garantia de 7 dias</h3>
          <p className="close-page__guarantee-text">
            Se você não ficar satisfeito com o conteúdo nos primeiros 7 dias, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="close-page__faq">
        <h2 className="close-page__faq-title">Perguntas Frequentes</h2>
        {[
          {
            q: '🔒 É seguro fazer o pagamento?',
            a: 'Sim! O pagamento é feito via PIX, direto pelo app do seu banco. Não pedimos senha, cartão ou dados pessoais. É rápido, seguro e anônimo.'
          },
          {
            q: '⏳ Quanto tempo demora pra liberar o acesso?',
            a: 'O acesso é liberado automaticamente após a confirmação do PIX, que geralmente leva de 5 segundos a 2 minutos.'
          },
          {
            q: '👤 Alguém vai saber que eu comprei?',
            a: 'Não! O pagamento via PIX não aparece com nome de conteúdo adulto na fatura. Seu acesso é 100% discreto e privado.'
          },
          {
            q: '📱 Como vou receber o conteúdo?',
            a: 'Após o pagamento, você recebe acesso imediato ao grupo exclusivo com todas as mídias, vídeos e fotos disponíveis.'
          },
          {
            q: '💰 Tem mensalidade ou cobrança recorrente?',
            a: 'Não! É um pagamento único. Você paga uma vez e tem acesso vitalício a todo o conteúdo, sem surpresas.'
          }
        ].map((item, i) => (
          <div key={i} className={`close-page__faq-item${faqOpen === i ? ' close-page__faq-item--open' : ''}`}>
            <button className="close-page__faq-question" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
              <span>{item.q}</span>
              <span className="close-page__faq-arrow">{faqOpen === i ? '▲' : '▼'}</span>
            </button>
            {faqOpen === i && (
              <div className="close-page__faq-answer">
                <p>{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PIX Payment Popup */}
      {showPixPopup && (
        <div className="pix-popup__overlay" onClick={() => setShowPixPopup(false)}>
          <div className="pix-popup" onClick={(e) => e.stopPropagation()}>
            <button className="pix-popup__close" onClick={() => setShowPixPopup(false)}>
              ×
            </button>
            <div className="pix-popup__header">
              <span className="pix-popup__icon">💳</span>
              <h2 className="pix-popup__title">Pagamento via PIX</h2>
              <p className="pix-popup__plan-name">
                {selectedPlan === 'vip' ? '👑 Acesso VIP Completo' : '🔥 Acesso Simples'}
              </p>
              <p className="pix-popup__amount">
                R$ {getTotal()}
              </p>
            </div>

            {/* Order Bump */}
            <div className={`pix-bump${orderBump ? ' pix-bump--active' : ''}`} onClick={() => setOrderBump(!orderBump)}>
              <div className="pix-bump__ribbon">🎁 OFERTA ESPECIAL</div>
              <div className="pix-bump__inner">
                <div className="pix-bump__check-row">
                  <div className={`pix-bump__toggle${orderBump ? ' pix-bump__toggle--on' : ''}`}>
                    {orderBump && <span>✓</span>}
                  </div>
                  <div>
                    <h4 className="pix-bump__title">🎬 Vídeo Personalizado Exclusivo</h4>
                    <p className="pix-bump__subtitle">Adicione ao seu pedido!</p>
                  </div>
                </div>
                <p className="pix-bump__desc">
                  Se você me ajudar com um pouquinho a mais, eu vou gravar um vídeo exclusivo e personalizado só seu, do jeitinho que você quiser me pedir amor 😏
                </p>
                <div className="pix-bump__pricing">
                  <span className="pix-bump__old"><s>R$ 39,90</s></span>
                  <span className="pix-bump__arrow">→</span>
                  <span className="pix-bump__new">R$ 9,90</span>
                  <span className="pix-bump__save">-75%</span>
                </div>
              </div>
            </div>

            <div className="pix-popup__body">
              <p className="pix-popup__instructions">Copie o código PIX abaixo e cole no app do seu banco:</p>
              <div className="pix-popup__code-box">
                <code className="pix-popup__code">{getPixCode()}</code>
              </div>
              <button className={`pix-popup__copy-btn${pixCopied ? ' pix-popup__copy-btn--copied' : ''}`} onClick={copyPixCode}>
                {pixCopied ? '✅ Chave PIX copiada!' : 'Copiar código PIX 📋'}
              </button>
              <p className="pix-popup__note">⏳ Após o pagamento, o acesso é liberado automaticamente</p>
              <div className="pix-popup__timer">
                <span className="pix-popup__timer-text">O código expira em</span>
                <span className="pix-popup__timer-clock">
                  <svg className="pix-popup__timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {Math.floor(pixTimer / 60)}:{String(pixTimer % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Social proof toast */}
      {toast && (
        <div className={`close-page__toast${toast.visible ? ' close-page__toast--show' : ''}`}>
          <span className="close-page__toast-icon">✅</span>
          <div>
            <p className="close-page__toast-name">{toast.name} acabou de assinar</p>
            <p className="close-page__toast-sub">E já pode assistir a nova live ao vivo</p>
          </div>
        </div>
      )}

      {/* Footer legal */}
      <footer className="close-page__footer">
        <p>Este site contém conteúdo exclusivo para maiores de 18 anos.</p>
        <p>Ao adquirir, você concorda com os termos de uso e política de privacidade.</p>
        <p>© 2026 · Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
