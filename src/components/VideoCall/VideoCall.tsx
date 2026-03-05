import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react'
import Hls from 'hls.js'
import './VideoCall.css'

const RegisterForm = lazy(() => import('../RegisterForm/RegisterForm'))

// Data imports (extracted for code splitting)
import {
  REMOTE_VIDEO_URL_HLS, REMOTE_VIDEO_URL_HLS_2,
  REMOTE_VIDEO_URL_MP4, REMOTE_VIDEO_URL_MP4_2,
  AVATAR_URL, CONTACT_NAME, CONTACT_HANDLE,
  HEART_EMOJIS, STORAGE_KEY, QUICK_REACTIONS,
  getRandomTimeMessage, getLevelColor, FINAL_MESSAGES,
  type ChatMessage,
} from '../../data/videoCallData'
import { LIVE_USERS } from '../../data/videoCallUsers'
import { LIVE_MESSAGES, CLOSE_MESSAGES, URGENCY_MESSAGES } from '../../data/videoCallMessages'

interface VideoCallProps {
  onExit?: () => void
  onOpenClose?: () => void
}

export default function VideoCall({ onExit, onOpenClose }: VideoCallProps) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const heartsContainerRef = useRef<HTMLDivElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const video2StartTimeRef = useRef<number>(0)

  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const liveChatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [finalMessagesSent, setFinalMessagesSent] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true) // Auto-start connecting
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [showCallEndedScreen, setShowCallEndedScreen] = useState(false)
  const [videoPhase, setVideoPhase] = useState<1 | 'transition' | 2>(1)
  const [transitionCountdown, setTransitionCountdown] = useState(5)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showReconnectingFallback, setShowReconnectingFallback] = useState(false)
  const [showHeartsTip, setShowHeartsTip] = useState(false)
  const [viewerCount, setViewerCount] = useState(781)
  const [hostDiamonds, setHostDiamonds] = useState(2_305_131)
  const [showCtaCard, setShowCtaCard] = useState(false)
  const [ctaFading, setCtaFading] = useState<'in' | 'out' | null>(null)
  const ctaShownTimesRef = useRef<Set<number>>(new Set())
  const [isRegistered, setIsRegistered] = useState(false)
  const [showRegisterOverlay, setShowRegisterOverlay] = useState(false)
  const [hasPreviouslyAccessed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    }
    return false
  })

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || (isIOS && !/CriOS|iPhone.*Chrome|iPad.*Chrome/i.test(navigator.userAgent))

  // Meta Pixel: WatchedLive engagement events (instant, 30s, 2min, 5min, 8min)
  useEffect(() => {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive')

    const timer30s = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_30s')
    }, 30_000)

    const timer2min = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_2min')
    }, 120_000)

    const timer5min = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_5min')
    }, 300_000)

    const timer8min = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_8min')
    }, 480_000)

    return () => {
      clearTimeout(timer30s)
      clearTimeout(timer2min)
      clearTimeout(timer5min)
      clearTimeout(timer8min)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [])

  // If previously accessed, show ended screen immediately
  useEffect(() => {
    if (hasPreviouslyAccessed && !hasJoined) {
      setCallEnded(true)
      setIsConnecting(false)
    }
  }, [hasPreviouslyAccessed, hasJoined])

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatMessages.length > 0) scrollToBottom()
  }, [chatMessages, scrollToBottom])

  // Connecting → joined after 3s
  useEffect(() => {
    if (isConnecting && !hasJoined) {
      const timer = setTimeout(() => {
        setHasJoined(true)
        setIsConnecting(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnecting, hasJoined])

  // Initial chat messages from Julia
  useEffect(() => {
    if (!hasJoined) return
    const initialMessages: ChatMessage[] = [
      { id: `ju-1-${Date.now()}`, type: 'message', author: CONTACT_NAME, text: 'Oi amor! Tudo bem? 😘', isOwn: false, isHost: true },
      { id: `ju-2-${Date.now() + 1}`, type: 'message', author: CONTACT_NAME, text: 'Que bom que conseguiu entrar na chamada', isOwn: false, isHost: true },
      { id: `ju-3-${Date.now() + 2}`, type: 'message', author: CONTACT_NAME, text: 'Espero que goste do meu showzinho haha 😈', isOwn: false, isHost: true },
      { id: `ju-4-${Date.now() + 3}`, type: 'message', author: CONTACT_NAME, text: 'Me manda um ❤️ se gostar do que ver, tá?', isOwn: false, isHost: true },
    ]
    setChatMessages(initialMessages)
  }, [hasJoined])

  // Save accessed flag
  useEffect(() => {
    if (hasJoined) localStorage.setItem(STORAGE_KEY, 'true')
  }, [hasJoined])

  // "Toque na tela para reagir" tip — shows at start then every 35-45s
  useEffect(() => {
    if (!hasJoined) return
    let active = true

    // Show after a short delay on load
    const initialTimer = setTimeout(() => {
      if (!active) return
      showTip()
    }, 2000)

    const showTip = () => {
      if (!active) return
      setShowHeartsTip(true)
      setTimeout(() => { if (active) setShowHeartsTip(false) }, 3000)
    }

    const scheduleNext = () => {
      if (!active) return
      const delay = 35000 + Math.random() * 10000 // 35-45s
      return setTimeout(() => {
        if (!active) return
        showTip()
        tipTimer = scheduleNext()
      }, delay)
    }
    let tipTimer = scheduleNext()

    return () => { active = false; clearTimeout(initialTimer); if (tipTimer) clearTimeout(tipTimer) }
  }, [hasJoined])

  // ── Small random viewer drops to look realistic ──
  useEffect(() => {
    if (!hasJoined) return
    let active = true
    const scheduleDrop = () => {
      if (!active) return
      // Drop every 20-50s
      const delay = 20000 + Math.random() * 30000
      timer = setTimeout(() => {
        if (!active) return
        const drop = 5 + Math.floor(Math.random() * 16) // -5 to -20
        setViewerCount(prev => Math.max(650, prev - drop))
        scheduleDrop()
      }, delay)
    }
    let timer: ReturnType<typeof setTimeout>
    scheduleDrop()
    return () => { active = false; clearTimeout(timer) }
  }, [hasJoined])

  // ── Host diamonds slowly rising ──
  useEffect(() => {
    if (!hasJoined) return
    let active = true
    const tick = () => {
      if (!active) return
      // Every 8-25s, add 3-45 diamonds
      const delay = 8000 + Math.random() * 17000
      timer = setTimeout(() => {
        if (!active) return
        const gain = 3 + Math.floor(Math.random() * 43)
        setHostDiamonds(prev => prev + gain)
        tick()
      }, delay)
    }
    let timer: ReturnType<typeof setTimeout>
    tick()
    return () => { active = false; clearTimeout(timer) }
  }, [hasJoined])

  // ── CTA Card timed appearances ──
  // Video 1: 75s | Video 2: 30s, 126s, 277s, 320s, 378s, 485s
  useEffect(() => {
    if (!hasJoined || !isVideoLoaded) return
    const CTA_TIMES_V1 = [75]  // 1:15
    const CTA_TIMES_V2 = [30, 126, 277, 320, 378, 485] // 0:30, 2:06, 4:37, 5:20, 6:18, 8:05

    const check = () => {
      const vid = remoteVideoRef.current
      if (!vid) return
      const t = Math.floor(vid.currentTime)
      const times = videoPhase === 2 ? CTA_TIMES_V2 : CTA_TIMES_V1
      const phase = videoPhase === 2 ? 2 : 1
      for (const target of times) {
        const key = phase * 10000 + target
        if (t === target && !ctaShownTimesRef.current.has(key)) {
          ctaShownTimesRef.current.add(key)
          setCtaFading('in')
          setShowCtaCard(true)
          break
        }
      }
    }
    const iv = setInterval(check, 500)
    return () => clearInterval(iv)
  }, [hasJoined, isVideoLoaded, videoPhase])

  // ── CTA Card auto-hide after 15s ──
  useEffect(() => {
    if (!showCtaCard) return
    const timer = setTimeout(() => {
      setCtaFading('out')
      setTimeout(() => {
        setShowCtaCard(false)
        setCtaFading(null)
      }, 500) // fade-out duration
    }, 15000)
    return () => clearTimeout(timer)
  }, [showCtaCard])

  // ── Auto-hearts from chat viewers ──
  useEffect(() => {
    if (!hasJoined) return
    let active = true
    const spawnAutoHearts = () => {
      if (!active || !heartsContainerRef.current) return
      // 1-4 hearts in a burst
      const count = 1 + Math.floor(Math.random() * 4)
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!active || !heartsContainerRef.current) return
          const heart = document.createElement('div')
          heart.className = 'vc-heart'
          heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)]
          heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 60}px`)
          heart.style.left = `${Math.random() * 80}px`
          heartsContainerRef.current!.appendChild(heart)
          setTimeout(() => heart.remove(), 3000)
        }, i * (150 + Math.random() * 300))
      }
      // Next burst in 4-12s
      timer = setTimeout(spawnAutoHearts, 4000 + Math.random() * 8000)
    }
    let timer = setTimeout(spawnAutoHearts, 5000 + Math.random() * 5000)
    return () => { active = false; clearTimeout(timer) }
  }, [hasJoined])

  // Simulated live chat — S-curve speed: burst → calm → ramp-up → peak
  useEffect(() => {
    if (!hasJoined || !isVideoLoaded) return
    let active = true
    const startTime = Date.now()
    const timers: ReturnType<typeof setTimeout>[] = []

    const addAction = () => {
      if (!active) return
      const user = LIVE_USERS[Math.floor(Math.random() * LIVE_USERS.length)]
      const isJoin = Math.random() < 0.25

      if (isJoin) {
        setChatMessages(prev => [...prev, {
          id: `lj-${Date.now()}-${Math.random()}`,
          type: 'join' as const,
          author: user.name,
          text: '',
          level: user.level,
          levelColor: getLevelColor(user.level),
          isOwn: false,
          isHost: false,
        }].slice(-50))
        // Bump viewer count on join
        setViewerCount(prev => prev + 1)
      } else {
        // Determine special message pools
        const vid = remoteVideoRef.current
        const inVideo2 = video2StartTimeRef.current > 0
        const inVideo2Early = inVideo2 && (Date.now() - video2StartTimeRef.current) < 90_000
        const inVideo2Last120 = inVideo2 && vid && vid.duration > 0 && (vid.duration - vid.currentTime) <= 120
        const roll = Math.random()
        let text: string
        if (inVideo2Last120 && roll < 0.25) {
          text = URGENCY_MESSAGES[Math.floor(Math.random() * URGENCY_MESSAGES.length)]
        } else if (inVideo2Early && roll < 0.15) {
          text = CLOSE_MESSAGES[Math.floor(Math.random() * CLOSE_MESSAGES.length)]
        } else if (Math.random() < 0.06) {
          text = getRandomTimeMessage()
        } else {
          text = LIVE_MESSAGES[Math.floor(Math.random() * LIVE_MESSAGES.length)]
        }
        setChatMessages(prev => [...prev, {
          id: `lm-${Date.now()}-${Math.random()}`,
          type: 'message' as const,
          author: user.name,
          text,
          level: user.level,
          levelColor: getLevelColor(user.level),
          badgeEmoji: user.badge,
          isOwn: false,
          isHost: false,
        }].slice(-50))
      }
      setTimeout(() => scrollToBottom(), 0)
    }

    // S-curve delay: returns ms until next message based on elapsed time
    const getDelay = (): number => {
      const elapsed = Date.now() - startTime
      if (elapsed < 30_000) {
        // Phase 1 — Burst (0-30s): fast, simulates joining an active live
        return 800 + Math.random() * 1200
      } else if (elapsed < 120_000) {
        // Phase 2 — Calm (30s-2min): chat settles down
        return 3000 + Math.random() * 4000
      } else if (elapsed < 300_000) {
        // Phase 3 — Ramp-up (2min-5min): S-curve acceleration
        const progress = (elapsed - 120_000) / 180_000 // 0→1
        const minDelay = 3000 - progress * 2200        // 3000→800
        const range = 4000 - progress * 2500            // 4000→1500
        return minDelay + Math.random() * range
      } else {
        // Phase 4 — Peak (5min+): chat is flying
        return 600 + Math.random() * 1900
      }
    }

    // Mini-burst: 15% chance of 1-3 rapid follow-up messages (real chats have chain reactions)
    const maybeMiniBurst = () => {
      if (!active || Math.random() > 0.15) return
      const count = 1 + Math.floor(Math.random() * 3) // 1-3 rapid msgs
      let burstDelay = 0
      for (let i = 0; i < count; i++) {
        burstDelay += 200 + Math.random() * 400 // 200-600ms apart
        const t = setTimeout(() => { if (active) addAction() }, burstDelay)
        timers.push(t)
      }
    }

    const scheduleNext = () => {
      if (!active) return
      const delay = getDelay()
      liveChatTimerRef.current = setTimeout(() => {
        if (!active) return
        addAction()
        maybeMiniBurst()
        scheduleNext()
      }, delay)
    }

    // Initial burst: 4 quick messages to fill up the chat on entry
    let initDelay = 800
    for (let i = 0; i < 4; i++) {
      timers.push(setTimeout(() => { if (active) addAction() }, initDelay))
      initDelay += 500 + Math.random() * 700
    }

    // Then start the S-curve loop
    const startTimer = setTimeout(() => {
      if (active) scheduleNext()
    }, initDelay + 500)
    timers.push(startTimer)

    return () => {
      active = false
      timers.forEach(clearTimeout)
      if (liveChatTimerRef.current) clearTimeout(liveChatTimerRef.current)
    }
  }, [hasJoined, isVideoLoaded, scrollToBottom])

  // Setup remote video (HLS/MP4)
  useEffect(() => {
    if (!hasJoined || !remoteVideoRef.current) return
    setIsVideoLoaded(false)
    let retryCount = 0
    const MAX_RETRIES = 3
    const LOAD_TIMEOUT = 15000
    const RETRY_DELAY = 2000
    let loadTimeoutId: ReturnType<typeof setTimeout> | null = null
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null
    let isUsingFallback = false
    let isUsingMP4 = false
    let hlsInstance: Hls | null = null

    const cleanup = () => {
      if (loadTimeoutId) { clearTimeout(loadTimeoutId); loadTimeoutId = null }
      if (retryTimeoutId) { clearTimeout(retryTimeoutId); retryTimeoutId = null }
      if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; hlsRef.current = null }
    }

    const playVideo = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      const video = remoteVideoRef.current
      video.muted = false
      video.volume = 1.0
      video.play().then(() => { retryCount = 0; setIsVideoLoaded(true) }).catch(() => {
        if (video?.readyState >= 2) setIsVideoLoaded(true)
      })
    }

    const handleLoadSuccess = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      setIsVideoLoaded(true)
      setShowReconnectingFallback(false)
      playVideo()
    }

    const handleLoadError = () => {
      if (isUsingFallback) return
      cleanup()
      retryCount++
      if (retryCount < MAX_RETRIES) {
        retryTimeoutId = setTimeout(() => {
          if (!isUsingFallback && remoteVideoRef.current) {
            if (isUsingMP4) { isUsingFallback = true; setShowReconnectingFallback(true) }
            else loadHLS()
          }
        }, RETRY_DELAY)
      } else {
        if (!isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() }
        else { isUsingFallback = true; setShowReconnectingFallback(true) }
      }
    }

    const loadHLS = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      const video = remoteVideoRef.current
      if (isSafari) {
        video.pause(); video.removeAttribute('src'); video.load()
        setTimeout(() => setupHLSVideoNative(), 200)
        return
      }
      setupHLSVideoNative()
    }

    const setupHLSVideoNative = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      const video = remoteVideoRef.current
      video.setAttribute('crossorigin', 'anonymous')
      video.loop = false
      video.playsInline = true
      video.muted = false
      video.volume = 1.0

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = REMOTE_VIDEO_URL_HLS
        video.addEventListener('error', () => { if (!isUsingFallback && !isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() } }, { once: true })
        video.addEventListener('loadeddata', () => { if (!isUsingFallback) handleLoadSuccess() }, { once: true })
        if (isSafari) {
          video.addEventListener('canplay', () => { if (!isUsingFallback && !isVideoLoaded) handleLoadSuccess() }, { once: true })
          video.addEventListener('canplaythrough', () => { if (!isUsingFallback && !isVideoLoaded) handleLoadSuccess() }, { once: true })
          video.addEventListener('loadedmetadata', () => { if (!isUsingFallback && !isVideoLoaded && video.readyState >= 1) handleLoadSuccess() }, { once: true })
        }
        video.addEventListener('ended', () => setVideoEnded(true))
        loadTimeoutId = setTimeout(() => { if (video.readyState < 2 && !isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() } }, LOAD_TIMEOUT)
      } else if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 })
        hlsRef.current = hlsInstance
        hlsInstance.loadSource(REMOTE_VIDEO_URL_HLS)
        hlsInstance.attachMedia(video)
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => handleLoadSuccess())
        video.addEventListener('ended', () => setVideoEnded(true))
        hlsInstance.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hlsInstance?.recoverMediaError()
            else { isUsingMP4 = true; retryCount = 0; loadMP4() }
          }
        })
        loadTimeoutId = setTimeout(() => {
          if (!hlsInstance?.media || hlsInstance.media.readyState < 2) { if (!isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() } }
        }, LOAD_TIMEOUT)
      } else { isUsingMP4 = true; loadMP4() }
    }

    const loadMP4 = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      const video = remoteVideoRef.current
      if (isSafari) { video.pause(); video.src = ''; video.load() }
      video.setAttribute('crossorigin', 'anonymous')
      video.src = REMOTE_VIDEO_URL_MP4
      video.loop = false
      video.preload = 'auto'
      video.playsInline = true
      video.muted = false
      video.volume = 1.0
      loadTimeoutId = setTimeout(() => { if (video.readyState < 2) handleLoadError() }, LOAD_TIMEOUT)
      video.addEventListener('error', () => { if (!isUsingFallback) handleLoadError() }, { once: true })
      video.addEventListener('stalled', () => {
        if (!isUsingFallback && remoteVideoRef.current?.readyState !== undefined && remoteVideoRef.current.readyState < 2) {
          setTimeout(() => { if (remoteVideoRef.current && remoteVideoRef.current.readyState < 2 && !isUsingFallback) handleLoadError() }, 5000)
        }
      }, { once: true })
      video.addEventListener('loadeddata', () => { if (!isUsingFallback) handleLoadSuccess() }, { once: true })
      video.addEventListener('canplay', () => { if (!isUsingFallback) handleLoadSuccess() }, { once: true })
      video.addEventListener('ended', () => setVideoEnded(true))
      if (video.readyState >= 2) handleLoadSuccess()
    }

    loadHLS()
    return () => { cleanup(); isUsingFallback = true }
  }, [hasJoined])

  // Controls
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => {
      const next = !prev
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = !next
        remoteVideoRef.current.volume = next ? 1.0 : 0
        if (next) remoteVideoRef.current.play().catch(() => {})
      }
      return next
    })
  }, [])

  const handleEndCallClick = useCallback(() => setShowEndCallConfirm(true), [])

  const confirmEndCall = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (remoteVideoRef.current) { remoteVideoRef.current.pause(); remoteVideoRef.current.src = '' }
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowEndCallConfirm(false)
    setCallEnded(true)
  }, [])

  const cancelEndCall = useCallback(() => setShowEndCallConfirm(false), [])

  const createHeart = useCallback(() => {
    if (!heartsContainerRef.current) return
    const heart = document.createElement('div')
    heart.className = 'vc-heart'
    heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)]
    heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 60}px`)
    heart.style.left = `${Math.random() * 80}px`
    heartsContainerRef.current.appendChild(heart)
    setTimeout(() => heart.remove(), 3000)
  }, [])

  // Gate user actions behind registration
  const requireRegistration = useCallback((): boolean => {
    if (isRegistered) return true
    setShowRegisterOverlay(true)
    return false
  }, [isRegistered])

  const handleRegisterSubmit = useCallback((data: { nickname: string; contact: string; birthDate: string }) => {
    console.log('[Register]', data)
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: 'Cadastro Perfil' })
    setIsRegistered(true)
    setShowRegisterOverlay(false)
  }, [])

  const sendHeart = useCallback(() => {
    if (!requireRegistration()) return
    setChatMessages(prev => [...prev, { id: `heart-${Date.now()}`, type: 'message' as const, author: 'Você', text: '❤️', isOwn: true, isHost: false }].slice(-50))
    setTimeout(() => scrollToBottom(), 0)
    createHeart()
  }, [scrollToBottom, createHeart, requireRegistration])

  const sendMessage = useCallback(() => {
    if (!requireRegistration()) return
    if (!chatInput.trim()) return
    setChatMessages(prev => [...prev, { id: `me-${Date.now()}`, type: 'message' as const, author: 'Você', text: chatInput.trim(), isOwn: true, isHost: false }].slice(-50))
    setChatInput('')
    setTimeout(() => scrollToBottom(), 0)
  }, [chatInput, scrollToBottom, requireRegistration])

  const sendQuickReaction = useCallback((text: string) => {
    if (!requireRegistration()) return
    setChatMessages(prev => [...prev, { id: `qr-${Date.now()}`, type: 'message' as const, author: 'Você', text, isOwn: true, isHost: false }].slice(-50))
    setTimeout(() => scrollToBottom(), 0)
  }, [scrollToBottom, requireRegistration])

  const sendFinalMessages = useCallback(() => {
    let cumulativeDelay = 0
    FINAL_MESSAGES.forEach((msg, index) => {
      cumulativeDelay += index === 0 ? 0 : FINAL_MESSAGES[index - 1].delay
      setTimeout(() => {
        setIsTyping(true)
        const typingDuration = 1500 + Math.random() * 1000
        setTimeout(() => {
          setIsTyping(false)
          setChatMessages(prev => [...prev.slice(-49), { id: `ju-final-${Date.now()}-${index}`, type: 'message' as const, author: CONTACT_NAME, text: msg.text, isOwn: false, isHost: true }])
          setTimeout(() => scrollToBottom(), 0)
        }, typingDuration)
      }, cumulativeDelay)
    })
  }, [scrollToBottom])

  // Monitor video time for final messages
  useEffect(() => {
    if (!hasJoined || !isVideoLoaded || finalMessagesSent) return
    const video = remoteVideoRef.current
    if (!video) return
    const checkTime = () => {
      if (video.currentTime >= 859 && !finalMessagesSent) {
        setFinalMessagesSent(true)
        setIsTyping(true)
        setTimeout(() => { setIsTyping(false); sendFinalMessages() }, 2000)
      }
    }
    const interval = setInterval(checkTime, 100)
    video.addEventListener('timeupdate', checkTime)
    return () => { clearInterval(interval); video.removeEventListener('timeupdate', checkTime) }
  }, [hasJoined, isVideoLoaded, finalMessagesSent, sendFinalMessages])

  // Video ended → trigger transition or end
  useEffect(() => {
    if (!videoEnded || !hasJoined) return
    if (videoPhase === 1) {
      setVideoPhase('transition')
    }
    if (videoPhase === 2) {
      const timer = setTimeout(() => setShowCallEndedScreen(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [videoEnded, hasJoined, videoPhase])

  // Transition countdown → load video 2
  useEffect(() => {
    if (videoPhase !== 'transition') return
    let count = 5
    setTransitionCountdown(5)
    const interval = setInterval(() => {
      count--
      setTransitionCountdown(count)
      if (count <= 0) {
        clearInterval(interval)
        const video = remoteVideoRef.current
        if (video) {
          video.pause()
          // Destroy existing HLS instance if any
          if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

          const onVideo2Ready = () => {
            setVideoEnded(false)
            setVideoPhase(2)
            video2StartTimeRef.current = Date.now()
            video.play().catch(() => {})
          }

          // Try HLS first for video 2, fallback to MP4
          if (REMOTE_VIDEO_URL_HLS_2 && video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = REMOTE_VIDEO_URL_HLS_2
            video.load()
            video.addEventListener('canplay', () => onVideo2Ready(), { once: true })
            video.addEventListener('ended', () => setVideoEnded(true), { once: true })
          } else if (REMOTE_VIDEO_URL_HLS_2 && Hls.isSupported()) {
            // hls.js for Chrome/Firefox
            const hls2 = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 })
            hlsRef.current = hls2
            hls2.loadSource(REMOTE_VIDEO_URL_HLS_2)
            hls2.attachMedia(video)
            hls2.on(Hls.Events.MANIFEST_PARSED, () => onVideo2Ready())
            hls2.on(Hls.Events.ERROR, (_e, data) => {
              if (data.fatal) {
                // HLS failed, fallback to MP4
                hls2.destroy(); hlsRef.current = null
                video.src = REMOTE_VIDEO_URL_MP4_2
                video.load()
                video.addEventListener('canplay', () => onVideo2Ready(), { once: true })
              }
            })
            video.addEventListener('ended', () => setVideoEnded(true), { once: true })
          } else {
            // No HLS support, use MP4 directly
            video.src = REMOTE_VIDEO_URL_MP4_2
            video.load()
            video.addEventListener('canplay', () => onVideo2Ready(), { once: true })
            video.addEventListener('ended', () => setVideoEnded(true), { once: true })
          }
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [videoPhase])

  // ─── Render: Call Ended screens ───────────────────────────────
  const isNaturalEnd = videoEnded && !callEnded && showCallEndedScreen
  const isManualEnd = callEnded
  const isPreviousAccess = hasPreviouslyAccessed && !hasJoined

  // Auto-redirect to Close Friends after 10s when video ends naturally
  useEffect(() => {
    if (!isNaturalEnd || !onOpenClose) return
    const timer = setTimeout(() => onOpenClose(), 10000)
    return () => clearTimeout(timer)
  }, [isNaturalEnd, onOpenClose])

  if (isNaturalEnd || isManualEnd || isPreviousAccess) {
    const message = isManualEnd ? 'Você se desconectou da chamada.' : 'Esta transmissão chegou ao fim.'
    return (
      <div className="vc-ended-container">
        <div className="vc-ended-modal">
          <div className="vc-ended-header">
            <div className="vc-ended-logo">privacy.</div>
            <h1 className="vc-ended-title">Chamada Encerrada</h1>
          </div>
          <div className="vc-ended-content">
            <p className="vc-ended-message">{message}</p>
            <p className="vc-ended-thanks">Obrigado por participar desta chamada privada.</p>
            <p className="vc-ended-security">Protegido para manter sua experiência segura.</p>
            {onExit && !isNaturalEnd && (
              <button className="vc-ended-back" onClick={onExit}>Voltar ao perfil</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Reconnecting ────────────────────────────────────
  if (hasJoined && showReconnectingFallback && !videoEnded && !callEnded) {
    return (
      <div className="vc-connecting-container">
        <div className="vc-connecting-modal">
          <div className="vc-connecting-spinner">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round">
                <animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;30 60;0 60;0 60" repeatCount="indefinite" />
                <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-30;-60;-60" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div className="vc-connecting-content">
            <h2 className="vc-connecting-title">Reconectando...</h2>
            <div className="vc-connecting-status">
              <div className="vc-status-item">
                <span className="vc-status-dot-loading" />
                <span>Estabelecendo conexão com sala privada...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Connecting ──────────────────────────────────────
  if (isConnecting && !hasJoined) {
    return (
      <div className="vc-connecting-container">
        <div className="vc-connecting-modal">
          <div className="vc-connecting-spinner">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round">
                <animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;30 60;0 60;0 60" repeatCount="indefinite" />
                <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-30;-60;-60" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div className="vc-connecting-content">
            <h2 className="vc-connecting-title">Confirmando conexão</h2>
            <div className="vc-connecting-status">
              <div className="vc-status-item">
                <span className="vc-status-dot-online" />
                <span>{CONTACT_HANDLE} está online</span>
              </div>
              <div className="vc-status-item">
                <span className="vc-status-dot-loading" />
                <span>Entrando na sala ao vivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Active Call ─────────────────────────────────────
  return (
    <div className="vc-call-container">
      {/* Top bar — Bigo style */}
      <div className="vc-top-bar">
        <div className="vc-host-pill">
          <div className="vc-host-avatar-ring">
            <img src={AVATAR_URL} alt={CONTACT_NAME} className="vc-host-avatar" />
            <div className="vc-host-live-dot" />
          </div>
          <div className="vc-host-info">
            <span className="vc-host-name">{CONTACT_NAME}</span>
            <span className="vc-host-id">💎 {hostDiamonds.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div className="vc-viewer-count">
          <span className="vc-viewer-dot" />
          <span>{viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}k` : viewerCount}</span>
        </div>
        <button className="vc-close-btn" onClick={handleEndCallClick} title="Sair da live">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Remote video */}
      <div className="vc-remote-video-container" onClick={createHeart}>
        {!isVideoLoaded && (
          <div className="vc-video-loading-overlay">
            <div className="vc-video-loading-spinner" />
            <p>Carregando transmissão...</p>
          </div>
        )}
        {/* Transition overlay between video 1 and 2 */}
        {videoPhase === 'transition' && (
          <div className="vc-video-loading-overlay vc-transition-overlay">
            <div className="vc-video-loading-spinner" />
            <p className="vc-transition-text">Carregando transmissão da live de ontem...</p>
            <div className="vc-transition-countdown">{transitionCountdown}</div>
          </div>
        )}
        <video id="vc-remote-video" ref={remoteVideoRef} autoPlay playsInline />
        <div className="vc-video-overlay">
          {showHeartsTip && <div className="vc-hearts-tip">Toque na tela para reagir ❤️</div>}
          <div className="vc-hearts-container" ref={heartsContainerRef} />
        </div>
      </div>

      {/* Live Chat Overlay */}
      <div className="vc-live-chat">
        <div className="vc-live-messages" ref={chatMessagesRef}>
          {chatMessages.map(msg =>
            msg.type === 'join' ? (
              <div key={msg.id} className="vc-live-join">
                {(msg.level ?? 0) > 0 && (
                  <span className="vc-live-badge" style={{ background: msg.levelColor }}>💎 {msg.level}</span>
                )}
                <span className="vc-live-join-name">{msg.author}</span>
                <span className="vc-live-join-text">entrou</span>
              </div>
            ) : (
              <div key={msg.id} className={`vc-live-msg ${msg.isOwn ? 'vc-live-msg-own' : ''} ${msg.isHost ? 'vc-live-msg-host' : ''}`}>
                {msg.badgeEmoji && <span className="vc-live-emoji-badge">{msg.badgeEmoji}</span>}
                {(msg.level ?? 0) > 0 && (
                  <span className="vc-live-badge" style={{ background: msg.levelColor }}>💎 {msg.level}</span>
                )}
                <span className="vc-live-author" style={{ color: msg.isHost ? '#ff6ba3' : msg.isOwn ? '#fbbf24' : (msg.levelColor || '#94a3b8') }}>
                  {msg.author}
                </span>
                <span className="vc-live-separator">:</span>
                <span className="vc-live-text">{msg.text}</span>
              </div>
            )
          )}
          {isTyping && (
            <div className="vc-live-msg vc-live-msg-host">
              <span className="vc-live-author" style={{ color: '#ff6ba3' }}>{CONTACT_NAME}</span>
              <span className="vc-live-typing"><span /><span /><span /></span>
            </div>
          )}
        </div>

        {/* CTA Card — close friends invite */}
        {showCtaCard && (
          <div className={`vc-cta-card ${ctaFading === 'in' ? 'vc-cta-card--fade-in' : ''} ${ctaFading === 'out' ? 'vc-cta-card--fade-out' : ''}`} onClick={() => { setShowCtaCard(false); setCtaFading(null); onOpenClose?.() }} style={{ cursor: 'pointer' }}>
            <div className="vc-cta-card__avatar-ring">
              <img src="/foto1.jpg" alt="Julia" className="vc-cta-card__avatar" />
            </div>
            <div className="vc-cta-card__body">
              <span className="vc-cta-card__name">Julia🫦😏</span>
              <span className="vc-cta-card__text">Convidou você para o close com lives privadas e conteúdos +18...</span>
            </div>
            <span className="vc-cta-card__btn">Entrar 🙈</span>
          </div>
        )}

        <div className="vc-live-reactions">
          {QUICK_REACTIONS.map(r => (
            <button key={r.id} className="vc-live-reaction-btn" onClick={() => sendQuickReaction(r.text)}>
              {r.text}
            </button>
          ))}
        </div>

        <div className="vc-live-input-bar">
          <button className="vc-live-input-icon" onClick={sendHeart} title="Reagir">😊</button>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onFocus={e => { if (!isRegistered) { e.target.blur(); setShowRegisterOverlay(true) } }}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
            placeholder="Diga Oi..."
            maxLength={200}
          />
          <button className="vc-live-send-btn" onClick={sendMessage} title="Enviar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
          <button className={`vc-live-input-icon ${!isSpeakerOn ? 'vc-live-icon-off' : ''}`} onClick={toggleSpeaker} title={isSpeakerOn ? 'Desativar som' : 'Ativar som'}>
            {isSpeakerOn ? '🔊' : '🔇'}
          </button>
          <button className="vc-live-input-icon vc-live-gift-btn" onClick={sendHeart} title="Presente">🎁</button>
        </div>
      </div>

      {/* Register overlay — appears over the live video */}
      {showRegisterOverlay && (
        <div className="vc-register-overlay">
          <Suspense fallback={null}>
            <RegisterForm onSubmit={handleRegisterSubmit} />
          </Suspense>
        </div>
      )}

      {/* End call confirm */}
      {showEndCallConfirm && (
        <div className="vc-end-confirm-overlay">
          <div className="vc-end-confirm-modal">
            <h2 className="vc-end-confirm-title">Encerrar chamada?</h2>
            <p className="vc-end-confirm-warning">Tem certeza que deseja encerrar esta chamada? Esta ação não pode ser desfeita.</p>
            <div className="vc-end-confirm-buttons">
              <button className="vc-end-confirm-cancel" onClick={cancelEndCall}>Cancelar</button>
              <button className="vc-end-confirm-continue" onClick={confirmEndCall}>Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
