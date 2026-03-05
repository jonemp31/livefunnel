import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import './VideoCall.css'

// URLs do vídeo - HLS como principal, MP4 como fallback
const REMOTE_VIDEO_URL_HLS = 'https://filesjon.zapsafe.work/loira/chamada/videochamada.m3u8'
const REMOTE_VIDEO_URL_MP4 = 'https://filesjon.zapsafe.work/loira/chamada/videochamada.mp4'
const AVATAR_URL = 'https://filesjon.zapsafe.work/loira/fotos/perfildoprivacy.png'
const CONTACT_NAME = 'Gi Campos'
const CONTACT_HANDLE = '@gicampos1'
const HEART_EMOJIS = ['❤️', '💖', '💜', '💙', '💛', '🩷', '💗', '💕', '🔥', '💞', '💓', '💗', '💖', '💝', '💘', '💕', '💞', '💓', '💗', '💖', '💝', '💘']
const STORAGE_KEY = 'video_call_accessed'
const VIDEO_TIME_STORAGE_KEY = 'video_call_time'

interface ChatMessage {
  id: string
  author: string
  text: string
  time: string
  isOwn: boolean
}

export function VideoCall() {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const heartsContainerRef = useRef<HTMLDivElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const canvasStreamRef = useRef<MediaStream | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const [isMuted, setIsMuted] = useState(true) // Microfone inicia mudo
  const [isVideoOff, setIsVideoOff] = useState(false) // Vídeo inicia ativado
  const [isSpeakerOn, setIsSpeakerOn] = useState(true) // Som do vídeo remoto inicia ativado
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null)
  const [finalMessagesSent, setFinalMessagesSent] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [showCallEndedScreen, setShowCallEndedScreen] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showReconnectingFallback, setShowReconnectingFallback] = useState(false)
  // Verificar localStorage antes do primeiro render para evitar flash
  const [hasPreviouslyAccessed, setHasPreviouslyAccessed] = useState(() => {
    if (typeof window !== 'undefined') {
      const accessed = localStorage.getItem(STORAGE_KEY)
      return accessed === 'true'
    }
    return false
  })


  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || (isIOS && !/CriOS|iPhone.*Chrome|iPad.*Chrome/i.test(navigator.userAgent))

  const scrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [])


  useEffect(() => {
    if (hasPreviouslyAccessed && !hasJoined) {
      localStorage.setItem(STORAGE_KEY, 'true')
      sessionStorage.removeItem(VIDEO_TIME_STORAGE_KEY)
      setCallEnded(true)
      setHasJoined(false)
      setIsConnecting(false)
    }
  }, [hasPreviouslyAccessed, hasJoined, isIOS])

  // Scroll automático para o final quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatMessages.length > 0) {
      scrollToBottom()
    }
  }, [chatMessages, scrollToBottom])

  const createSimulatedLocalVideo = useCallback(() => {
    if (!localVideoRef.current) return

    // Limpar canvas anterior se existir
    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach(track => track.stop())
      canvasStreamRef.current = null
    }

    const canvas = document.createElement('canvas')
    canvas.width = isMobile ? 320 : 640
    canvas.height = isMobile ? 240 : 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastFrameTime = 0
    const targetFPS = isMobile ? 15 : 30
    const frameInterval = 1000 / targetFPS

    const draw = (currentTime: number) => {
      if (currentTime - lastFrameTime < frameInterval) {
        requestAnimationFrame(draw)
        return
      }
      lastFrameTime = currentTime

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      const time = currentTime * 0.001
      gradient.addColorStop(0, `hsl(${time * 50 % 360}, 70%, 50%)`)
      gradient.addColorStop(1, `hsl(${(time * 50 + 60) % 360}, 70%, 50%)`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = 'white'
      ctx.font = isMobile ? 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' : 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Você', canvas.width / 2, canvas.height / 2)

      requestAnimationFrame(draw)
    }

    requestAnimationFrame(draw)

    const stream = canvas.captureStream(targetFPS)
    canvasStreamRef.current = stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
    }
  }, [isMobile])


  useEffect(() => {
    if (isConnecting && !hasJoined) {
      const timer = setTimeout(() => {
        setHasJoined(true)
        setIsConnecting(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnecting, hasJoined])

  // Adicionar mensagens iniciais de Gi quando entrar na chamada
  useEffect(() => {
    if (!hasJoined) return

    // Calcular hora de 1 minuto atrás
    const oneMinuteAgo = new Date(Date.now() - 60000)
    const time1 = oneMinuteAgo.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Criar mensagens iniciais
    const initialMessages: ChatMessage[] = [
      {
        id: `gi-1-${Date.now()}`,
        author: CONTACT_NAME,
        text: 'Oi amor! Tudo bem? 😘',
        time: time1,
        isOwn: false
      },
      {
        id: `gi-2-${Date.now() + 1}`,
        author: CONTACT_NAME,
        text: 'Que bom que conseguiu entrar na chamada',
        time: time1,
        isOwn: false
      },
      {
        id: `gi-3-${Date.now() + 2}`,
        author: CONTACT_NAME,
        text: 'Que delícia te ver aqui! Espero que goste do meu showzinho haha 😈',
        time: time1,
        isOwn: false
      },
      {
        id: `gi-4-${Date.now() + 3}`,
        author: CONTACT_NAME,
        text: 'Me manda um ❤️ se você gostar do que ver, tá?',
        time: time1,
        isOwn: false
      }
    ]

    setChatMessages(initialMessages)
    if (!isChatOpen) {
      setUnreadMessagesCount(initialMessages.length)
    } else {
      setUnreadMessagesCount(0)
    }
  }, [hasJoined])

  // Quando o chat é aberto, marcar todas as mensagens como lidas
  useEffect(() => {
    if (isChatOpen && chatMessages.length > 0) {
      // Encontrar a última mensagem de Gi (ou a última mensagem em geral)
      const giMessages = chatMessages.filter(msg => !msg.isOwn)
      if (giMessages.length > 0) {
        const lastGiMessage = giMessages[giMessages.length - 1]
        setLastReadMessageId(lastGiMessage.id)
        setUnreadMessagesCount(0)
      } else {
        // Se não há mensagens de Gi, marcar a última mensagem como lida
        const lastMessage = chatMessages[chatMessages.length - 1]
        setLastReadMessageId(lastMessage.id)
        setUnreadMessagesCount(0)
      }
    }
  }, [isChatOpen, chatMessages])

  // Contar mensagens não lidas quando o chat está fechado
  useEffect(() => {
    // Se o chat está aberto, não contar
    if (isChatOpen) {
      return
    }
    
    // Se o chat está fechado, contar apenas mensagens de Gi que foram adicionadas DEPOIS da última leitura
    if (chatMessages.length > 0) {
      const giMessages = chatMessages.filter(msg => !msg.isOwn)
      
      if (lastReadMessageId === null) {
        // Se nunca leu, todas as mensagens de Gi são não lidas
        setUnreadMessagesCount(giMessages.length)
      } else {
        // Contar apenas mensagens de Gi que foram adicionadas depois da última mensagem lida
        const lastReadIndex = chatMessages.findIndex(msg => msg.id === lastReadMessageId)
        const unreadGiMessages = giMessages.filter((msg) => {
          const messageIndex = chatMessages.findIndex(m => m.id === msg.id)
          return messageIndex > lastReadIndex
        })
        setUnreadMessagesCount(unreadGiMessages.length)
      }
    } else {
      setUnreadMessagesCount(0)
    }
  }, [isChatOpen, chatMessages, lastReadMessageId])


  useEffect(() => {
    if (hasJoined && !hasPreviouslyAccessed) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setHasPreviouslyAccessed(true)
    }
  }, [hasJoined, hasPreviouslyAccessed])

  useEffect(() => {
    if (!hasJoined) return

    const setupLocalVideo = async () => {
      if (!localVideoRef.current) return

      // Limpar streams anteriores
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }
      if (canvasStreamRef.current) {
        canvasStreamRef.current.getTracks().forEach(track => track.stop())
        canvasStreamRef.current = null
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        createSimulatedLocalVideo()
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true
        })

        localStreamRef.current = stream
        
        const canvasStream = canvasStreamRef.current as MediaStream | null
        if (canvasStream) {
          canvasStream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
          canvasStreamRef.current = null
        }

        if (localVideoRef.current) {
          const video = localVideoRef.current
          video.setAttribute('playsinline', 'true')
          video.setAttribute('webkit-playsinline', 'true')
          video.muted = true
          video.srcObject = stream

          stream.getAudioTracks().forEach(track => {
            track.enabled = false
          })
          stream.getVideoTracks().forEach(track => {
            track.enabled = true
          })

          video.style.opacity = '1'
          video.play().catch(() => {})
        }
      } catch (error: any) {
        createSimulatedLocalVideo()
      }
    }

    setupLocalVideo()

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }
      if (canvasStreamRef.current) {
        canvasStreamRef.current.getTracks().forEach(track => track.stop())
        canvasStreamRef.current = null
      }
    }
  }, [hasJoined, isMobile, createSimulatedLocalVideo])

  useEffect(() => {
    if (!hasJoined || !remoteVideoRef.current) return

    setIsVideoLoaded(false)
    let retryCount = 0
    const MAX_RETRIES = 3
    const LOAD_TIMEOUT = 15000 // 15 segundos
    const RETRY_DELAY = 2000 // 2 segundos entre tentativas
    let loadTimeoutId: NodeJS.Timeout | null = null
    let retryTimeoutId: NodeJS.Timeout | null = null
    let isUsingFallback = false
    let isUsingMP4 = false
    let hlsInstance: Hls | null = null

    const cleanup = () => {
      if (loadTimeoutId) {
        clearTimeout(loadTimeoutId)
        loadTimeoutId = null
      }
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
        retryTimeoutId = null
      }
      if (hlsInstance) {
        hlsInstance.destroy()
        hlsInstance = null
        hlsRef.current = null
      }
    }

    const playVideo = () => {
      if (!remoteVideoRef.current || isUsingFallback) return

      cleanup()
      const video = remoteVideoRef.current
      // Garantir que o som esteja ativado
      video.muted = false
      video.volume = 1.0
      
      video
        .play()
        .then(() => {
          retryCount = 0
          setIsVideoLoaded(true)
        })
        .catch(() => {
          if (video && video.readyState >= 2) {
            setIsVideoLoaded(true)
          }
        })
    }

    const handleLoadSuccess = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      setIsVideoLoaded(true) // Marcar vídeo como carregado
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
            if (isUsingMP4) {
              isUsingFallback = true
              setShowReconnectingFallback(true)
            } else {
              loadHLS()
            }
          }
        }, RETRY_DELAY)
      } else {
        if (!isUsingMP4) {
          isUsingMP4 = true
          retryCount = 0
          loadMP4()
        } else {
          isUsingFallback = true
          setShowReconnectingFallback(true)
        }
      }
    }

    const loadHLS = () => {
      if (!remoteVideoRef.current || isUsingFallback) return

      cleanup()

      const video = remoteVideoRef.current
      
      if (isSafari) {
        video.pause()
        video.removeAttribute('src')
        video.load()
        setTimeout(() => {
          setupHLSVideoNative()
        }, 200)
        return
      }
      
      setupHLSVideoNative()
    }
    
    const setupHLSVideoNative = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      
      const video = remoteVideoRef.current
      
      video.setAttribute('crossorigin', 'anonymous')
      video.loop = false // Loop removido
      video.playsInline = true
      video.muted = false // Som ativado
      video.volume = 1.0 // Volume máximo

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = REMOTE_VIDEO_URL_HLS

        const errorHandler = () => {
          if (!isUsingFallback && !isUsingMP4) {
            isUsingMP4 = true
            retryCount = 0
            loadMP4()
          }
        }

        const loadedDataHandler = () => {
          if (!isUsingFallback && video) {
            handleLoadSuccess()
          }
        }

        const canPlayHandler = () => {
          if (!isUsingFallback && isSafari && video && !isVideoLoaded) {
            handleLoadSuccess()
          }
        }

        video.addEventListener('error', errorHandler, { once: true })
        video.addEventListener('loadeddata', loadedDataHandler, { once: true })
        if (isSafari) {
          video.addEventListener('canplay', canPlayHandler, { once: true })
          video.addEventListener('canplaythrough', () => {
            if (!isUsingFallback && video && !isVideoLoaded) {
              handleLoadSuccess()
            }
          }, { once: true })
          video.addEventListener('loadedmetadata', () => {
            if (!isUsingFallback && video && !isVideoLoaded && video.readyState >= 1) {
              handleLoadSuccess()
            }
          }, { once: true })
        }
        video.addEventListener('ended', () => {
          setVideoEnded(true)
        })

        loadTimeoutId = setTimeout(() => {
          if (video.readyState < 2 && !isUsingMP4) {
            errorHandler()
          }
        }, LOAD_TIMEOUT)
      } else if (Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        })

        hlsRef.current = hlsInstance

        hlsInstance.loadSource(REMOTE_VIDEO_URL_HLS)
        hlsInstance.attachMedia(video)

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          handleLoadSuccess()
        })


        video.addEventListener('ended', () => {
          setVideoEnded(true)
        })

        hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                isUsingMP4 = true
                retryCount = 0
                loadMP4()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance?.recoverMediaError()
                break
              default:
                isUsingMP4 = true
                retryCount = 0
                loadMP4()
                break
            }
          }
        })

        loadTimeoutId = setTimeout(() => {
          const media = hlsInstance?.media
          if (!hlsInstance || !media || media.readyState < 2) {
            if (!isUsingMP4) {
              isUsingMP4 = true
              retryCount = 0
              loadMP4()
            }
          }
        }, LOAD_TIMEOUT)
      } else {
        isUsingMP4 = true
        loadMP4()
      }
    }

    const loadMP4 = () => {
      if (!remoteVideoRef.current || isUsingFallback) return

      cleanup()

      const video = remoteVideoRef.current
      
      if (isSafari) {
        video.pause()
        video.src = ''
        video.load()
      }
      
      video.setAttribute('crossorigin', 'anonymous')
      video.src = REMOTE_VIDEO_URL_MP4
      video.loop = false
      video.preload = 'auto'
      video.playsInline = true
      video.muted = false
      video.volume = 1.0

      loadTimeoutId = setTimeout(() => {
        if (video.readyState < 2) {
          handleLoadError()
        }
      }, LOAD_TIMEOUT)

      const errorHandler = () => {
        if (!isUsingFallback) {
          handleLoadError()
        }
      }

      const stalledHandler = () => {
        if (!isUsingFallback && remoteVideoRef.current && remoteVideoRef.current.readyState < 2) {
          setTimeout(() => {
            if (remoteVideoRef.current && remoteVideoRef.current.readyState < 2 && !isUsingFallback) {
              handleLoadError()
            }
          }, 5000)
        }
      }

      const loadedDataHandler = () => {
        if (!isUsingFallback) {
          handleLoadSuccess()
        }
      }

      const canPlayHandler = () => {
        if (!isUsingFallback) {
          handleLoadSuccess()
        }
      }

      const endedHandler = () => {
        setVideoEnded(true)
      }

      video.addEventListener('error', errorHandler, { once: true })
      video.addEventListener('stalled', stalledHandler, { once: true })
      video.addEventListener('loadeddata', loadedDataHandler, { once: true })
      video.addEventListener('canplay', canPlayHandler, { once: true })
      video.addEventListener('ended', endedHandler)

      // Verificar se já está carregado
      if (video.readyState >= 2) {
        handleLoadSuccess()
      }
    }

    loadHLS()

    // Cleanup ao desmontar
    return () => {
      cleanup()
      isUsingFallback = true
    }
  }, [hasJoined])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = newMuted
        })
      }
      return newMuted
    })
  }, [])

  const toggleVideo = useCallback(() => {
    setIsVideoOff(prev => {
      const newVideoOff = !prev
      
      if (newVideoOff) {
        // Vídeo desativado - mostrar canvas animado
        if (localStreamRef.current) {
          // Desabilitar track de vídeo da câmera
          localStreamRef.current.getVideoTracks().forEach(track => {
            track.enabled = false
          })
        }
        // Remover espelhamento do vídeo quando canvas estiver ativo
        if (localVideoRef.current) {
          localVideoRef.current.style.transform = 'translateZ(0)' // Remove scaleX(-1)
          localVideoRef.current.style.webkitTransform = 'translateZ(0)'
        }
        // Criar canvas animado
        createSimulatedLocalVideo()
      } else {
        // Vídeo reativado - restaurar câmera real
        if (canvasStreamRef.current) {
          // Parar canvas animado
          canvasStreamRef.current.getTracks().forEach(track => track.stop())
          canvasStreamRef.current = null
        }
        
        if (localStreamRef.current) {
          // Reabilitar track de vídeo da câmera
          localStreamRef.current.getVideoTracks().forEach(track => {
            track.enabled = true
          })
          
          // Restaurar stream da câmera no vídeo e espelhamento
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current
            localVideoRef.current.style.opacity = '1'
            // Restaurar espelhamento para a câmera
            localVideoRef.current.style.transform = 'scaleX(-1) translateZ(0)'
            localVideoRef.current.style.webkitTransform = 'scaleX(-1) translateZ(0)'
            localVideoRef.current.play().catch(err => {
              console.log('[VideoCall] Erro ao reproduzir vídeo após reativar:', err)
            })
          }
        } else {
          // Se não há stream da câmera, tentar obter novamente
          console.log('[VideoCall] Nenhum stream de câmera disponível, tentando obter...')
          // O useEffect vai tentar obter a câmera novamente quando necessário
        }
      }
      
      return newVideoOff
    })
  }, [createSimulatedLocalVideo])

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => {
      const newSpeakerOn = !prev
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = !newSpeakerOn
        remoteVideoRef.current.volume = newSpeakerOn ? 1.0 : 0
        if (newSpeakerOn) {
          remoteVideoRef.current.play().catch(() => {})
        }
      }
      return newSpeakerOn
    })
  }, [])

  const handleEndCallClick = useCallback(() => {
    // Mostrar popup de confirmação
    setShowEndCallConfirm(true)
  }, [])

  const confirmEndCall = useCallback(() => {
    // Parar todos os streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach(track => track.stop())
      canvasStreamRef.current = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause()
      remoteVideoRef.current.src = ''
    }

    // Salvar flag de acesso no localStorage
    localStorage.setItem(STORAGE_KEY, 'true')
    sessionStorage.removeItem(VIDEO_TIME_STORAGE_KEY)
    // Marcar como acessado para evitar acesso futuro
    setHasPreviouslyAccessed(true)

    // Fechar popup e mostrar tela de chamada encerrada
    setShowEndCallConfirm(false)
    setCallEnded(true)
  }, [])

  const cancelEndCall = useCallback(() => {
    // Fechar popup sem fazer nada
    setShowEndCallConfirm(false)
  }, [])


  const createHeart = useCallback(() => {
    if (!heartsContainerRef.current) return

    const heart = document.createElement('div')
    heart.className = 'heart'
    heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)]
    const randomX = (Math.random() - 0.5) * 60
    heart.style.setProperty('--tx', `${randomX}px`)
    heart.style.left = `${Math.random() * 80}px`
    heartsContainerRef.current.appendChild(heart)

    setTimeout(() => heart.remove(), 3000)
  }, [])

  const sendHeart = useCallback(() => {
    const time = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const newMessage: ChatMessage = {
      id: `heart-${Date.now()}`,
      author: 'Você',
      text: '❤️',
      time,
      isOwn: true
    }

    setChatMessages(prev => [...prev, newMessage])
    
    // Scroll para o final após adicionar mensagem
    setTimeout(() => scrollToBottom(), 0)
  }, [scrollToBottom])

  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return

    const time = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const newMessage: ChatMessage = {
      id: `me-${Date.now()}`,
      author: 'Você',
      text: chatInput.trim(),
      time,
      isOwn: true
    }

    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')

    // Scroll para o final após adicionar mensagem
    setTimeout(() => scrollToBottom(), 0)
  }, [chatInput, scrollToBottom])

  // Mensagens finais de Gi no minuto 14:19 (859 segundos)
  const finalMessages = [
    { text: 'Preciso sair da call agora amor, desculpa 😔', delay: 0 },
    { text: 'O que vc achou da nossa chamada? Gostou? 😏', delay: 3000 },
    { text: 'foi meio rápido, mas foi legal te ver aqui haha', delay: 4000 },
    { text: 'Me chama no whats depois, vamos conversar mais! ❤️', delay: 3000 },
    { text: 'ia adorar te ver de novo, anjo...', delay: 4000 },
    { text: 'Quem sabe logo logo a gente nao marca outra, ne? 😈 Ia gostar disso?', delay: 3000 },
    { text: 'Ate mais amor, bjim 😘😘', delay: 4000 },
  ]

  // Função para enviar mensagens finais
  const sendFinalMessages = useCallback(() => {
    let cumulativeDelay = 0

    finalMessages.forEach((msg, index) => {
      cumulativeDelay += index === 0 ? 0 : finalMessages[index - 1].delay

      setTimeout(() => {
        // Mostrar "digitando..." antes de cada mensagem
        setIsTyping(true)
        
        // Duração aleatória de digitando: entre 1.5s e 2.5s
        const typingDuration = 1500 + Math.random() * 1000

        setTimeout(() => {
          setIsTyping(false)

          // Calcular horário dinamicamente
          const now = new Date()
          const time = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })

          const newMessage: ChatMessage = {
            id: `gi-final-${Date.now()}-${index}`,
            author: CONTACT_NAME,
            text: msg.text,
            time,
            isOwn: false
          }

          setChatMessages(prev => [...prev, newMessage])
          setTimeout(() => scrollToBottom(), 0)
        }, typingDuration)
      }, cumulativeDelay)
    })
  }, [scrollToBottom, finalMessages])

  // Monitorar tempo do vídeo para disparar mensagens finais
  useEffect(() => {
    if (!hasJoined || !isVideoLoaded || finalMessagesSent) return

    const video = remoteVideoRef.current
    if (!video) return

    const checkVideoTime = () => {
      const currentTime = video.currentTime
      const targetTime = 859 // 14:19 em segundos (14 * 60 + 19)

      if (currentTime >= targetTime && !finalMessagesSent) {
        setFinalMessagesSent(true)
        
        // Abrir chat no tamanho padrão (não expandir para tela cheia)
        setIsChatOpen(true)

        // Mostrar "digitando..." por 2 segundos
        setIsTyping(true)
        
        // Iniciar envio das mensagens após 2 segundos
        setTimeout(() => {
          setIsTyping(false)
          sendFinalMessages()
        }, 2000)
      }
    }

    const interval = setInterval(checkVideoTime, 100) // Verificar a cada 100ms
    video.addEventListener('timeupdate', checkVideoTime)

    return () => {
      clearInterval(interval)
      video.removeEventListener('timeupdate', checkVideoTime)
    }
  }, [hasJoined, isVideoLoaded, finalMessagesSent, sendFinalMessages])


  // Salvar flag quando o vídeo terminar (após reproduzir completamente)
  useEffect(() => {
    if (videoEnded && hasJoined) {
      localStorage.setItem(STORAGE_KEY, 'true')
      sessionStorage.removeItem(VIDEO_TIME_STORAGE_KEY)
      // Marcar como acessado para evitar acesso futuro
      setHasPreviouslyAccessed(true)
      
      // Aguardar 10 segundos antes de mostrar a tela de encerramento
      // Isso permite que o usuário veja o chat por mais tempo
      const timer = setTimeout(() => {
        setShowCallEndedScreen(true)
      }, 10000) // 10 segundos
      
      return () => clearTimeout(timer)
    }
  }, [videoEnded, hasJoined])

  // Se o vídeo terminou, aguardar 10 segundos antes de mostrar tela de chamada finalizada
  if (videoEnded && !callEnded && showCallEndedScreen) {
    return (
      <div className="call-ended-container">
        <div className="call-ended-modal">
          <div className="call-ended-header">
            <div className="call-ended-logo">privacy.</div>
            <h1 className="call-ended-title">Chamada Encerrada</h1>
          </div>
          <div className="call-ended-content">
            <p className="call-ended-message">Esta transmissão chegou ao fim.</p>
            <p className="call-ended-thanks">Obrigado por participar desta chamada privada.</p>
            <p className="call-ended-security">Protegido para manter sua experiência segura.</p>
          </div>
        </div>
      </div>
    )
  }

  // Se o usuário já acessou anteriormente (tentando novo acesso), mostrar mensagem de transmissão encerrada
  if (hasPreviouslyAccessed && !hasJoined) {
    return (
      <div className="call-ended-container">
        <div className="call-ended-modal">
          <div className="call-ended-header">
            <div className="call-ended-logo">privacy.</div>
            <h1 className="call-ended-title">Chamada Encerrada</h1>
          </div>
          <div className="call-ended-content">
            <p className="call-ended-message">
              Esta transmissão chegou ao fim.
            </p>
            <p className="call-ended-thanks">Obrigado por participar desta chamada privada.</p>
            <p className="call-ended-security">Protegido para manter sua experiência segura.</p>
          </div>
        </div>
      </div>
    )
  }

  // Se a chamada foi encerrada pelo usuário ANTES de entrar (cancelou na tela de convite)
  if (callEnded && !hasJoined) {
    return (
      <div className="call-ended-container">
        <div className="call-ended-modal">
          <div className="call-ended-header">
            <div className="call-ended-logo">privacy.</div>
            <h1 className="call-ended-title">Chamada Encerrada</h1>
          </div>
          <div className="call-ended-content">
            <p className="call-ended-message">Você se desconectou da chamada.</p>
            <p className="call-ended-thanks">Obrigado por participar desta chamada privada.</p>
            <p className="call-ended-security">Protegido para manter sua experiência segura.</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Se a chamada foi encerrada durante a chamada ativa
  if (callEnded && hasJoined) {
    return (
      <div className="call-ended-container">
        <div className="call-ended-modal">
          <div className="call-ended-header">
            <div className="call-ended-logo">privacy.</div>
            <h1 className="call-ended-title">Chamada Encerrada</h1>
          </div>
          <div className="call-ended-content">
            <p className="call-ended-message">Você se desconectou da chamada.</p>
            <p className="call-ended-thanks">Obrigado por participar desta chamada privada.</p>
            <p className="call-ended-security">Protegido para manter sua experiência segura.</p>
          </div>
        </div>
      </div>
    )
  }

  // Tela de reconexão - quando o vídeo não foi encontrado (apenas quando hasJoined é true e showReconnectingFallback é true)
  // Não mostrar se o vídeo já está carregado
  if (hasJoined && showReconnectingFallback && !videoEnded && !callEnded) {
    return (
      <div className="connecting-container">
        <div className="connecting-modal">
          <div className="connecting-spinner">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round">
                <animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;30 60;0 60;0 60" repeatCount="indefinite" />
                <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-30;-60;-60" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          <div className="connecting-content">
            <h2 className="connecting-title">Reconectando...</h2>

            <div className="connecting-status">
              <div className="status-item">
                <span className="status-dot-loading"></span>
                <span>Estabelecendo conexão com sala privada...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se o usuário ainda não entrou na chamada
  if (!hasJoined) {
    // Se já acessou antes, NUNCA mostrar convite - apenas "Chamada Encerrada"
    // Isso já foi tratado acima (hasPreviouslyAccessed && callEnded && !hasJoined)
    // Se chegou aqui e hasPreviouslyAccessed é true, retornar vazio (já foi tratado)
    if (hasPreviouslyAccessed) {
      return null
    }

    // Novo usuário: mostrar tela de conexão ou convite
    if (isConnecting) {
      return (
        <div className="connecting-container">
          <div className="connecting-modal">
            <div className="connecting-spinner">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round">
                  <animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;30 60;0 60;0 60" repeatCount="indefinite" />
                  <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-30;-60;-60" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            <div className="connecting-content">
              <h2 className="connecting-title">Confirmando conexão</h2>

              <div className="connecting-status">
                <div className="status-item">
                  <span className="status-dot-online"></span>
                  <span>{CONTACT_HANDLE} está online</span>
                </div>
                <div className="status-item">
                  <span className="status-dot-loading"></span>
                  <span>Entrando na sala ao vivo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Tela de convite (apenas para novo usuário que ainda não clicou em participar)
    return (
      <div className="invite-container">
          <div className="invite-modal">
            {/* Logo e título */}
            <div className="invite-header">
              <div className="invite-logo">privacy.</div>
              <h1 className="invite-title">Convite para chamada de vídeo</h1>
            </div>

            {/* Descrição */}
            <div className="invite-description-container">
              <p className="invite-description">
                {CONTACT_HANDLE} convidou você para uma transmissão ao vivo. Clique em participar para entrar na sala privada.
              </p>
            </div>

            {/* Botão principal */}
            <button
              className="invite-button"
              onClick={() => setIsConnecting(true)}
            >
              PARTICIPAR AGORA
            </button>

            {/* Informações de privacidade */}
            <div className="invite-footer">
              <p className="invite-footer-text">
                Esta é uma chamada privada, apenas você e {CONTACT_HANDLE} terão acesso ao conteúdo compartilhado.
              </p>
              <p className="invite-footer-small">
                Protegido para manter sua experiência segura.
              </p>
            </div>
          </div>
        </div>
      )
  }

  return (
    <div className="call-container">
      {/* Informações do contato */}
      <div className="contact-info">
        <div className="contact-avatar">
          <img src={AVATAR_URL} alt={CONTACT_NAME} className="avatar-image" />
          <div className="live-indicator"></div>
        </div>
        <div className="contact-details">
          <h2>{CONTACT_NAME}</h2>
          <p>@gicampos1</p>
        </div>
      </div>

      {/* Vídeo remoto */}
      <div
        className="remote-video-container"
        onClick={createHeart}
      >
        {!isVideoLoaded && (
          <div className="video-loading-overlay">
            <div className="video-loading-spinner"></div>
            <p>Carregando transmissão...</p>
          </div>
        )}
        <video id="remote-video" ref={remoteVideoRef} autoPlay playsInline />
        <div className="video-overlay">
          <div className="hearts-tip">Toque na tela para reagir ❤️</div>
          <div className="hearts-container" ref={heartsContainerRef}></div>
        </div>
      </div>

      {/* Vídeo local */}
      <div className="local-video-container">
        <video
          id="local-video"
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ opacity: isVideoOff ? 0.3 : 1 }}
        />
      </div>

      {/* Controles da chamada */}
      <div className="call-controls">
        <div className="control-item">
          <button
            className={`control-btn ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
          >
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>

        <div className="control-item">
          <button
            className={`control-btn ${isVideoOff ? 'off' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Ativar câmera' : 'Desativar câmera'}
          >
            {isVideoOff ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            )}
          </button>
        </div>

        <div className="control-item">
          <button
            className="control-btn"
            id="end-call-btn"
            onClick={handleEndCallClick}
            title="Desligar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>

        <div className="control-item">
          <button
            className={`control-btn ${isSpeakerOn ? 'active' : ''}`}
            onClick={toggleSpeaker}
            title={isSpeakerOn ? 'Desativar alto-falante' : 'Ativar alto-falante'}
          >
            {isSpeakerOn ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Chat ao vivo */}
      <div className={`live-chat-container ${isChatOpen ? '' : 'hidden'}`}>
        <div className="chat-header">
          <h3>Chat ao vivo</h3>
          <button
            className="chat-toggle-btn"
            onClick={() => setIsChatOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="chat-messages" ref={chatMessagesRef}>
          {chatMessages.map((message) => (
            <div key={message.id} className={`chat-message-wrapper ${message.isOwn ? 'own-message-wrapper' : 'other-message-wrapper'}`}>
              <div className={`chat-message ${message.isOwn ? 'own-message' : 'other-message'}`}>
                <div className="message-text">{message.text}</div>
              </div>
              <div className={`message-time ${message.isOwn ? 'own-time' : 'other-time'}`}>{message.time}</div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message-wrapper other-message-wrapper">
              <div className="chat-message other-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="chat-input-container">
          <button
            className="heart-chat-btn"
            onClick={sendHeart}
            title="Enviar coração"
          >
            <span>❤️</span>
          </button>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage()
              }
            }}
            placeholder="Digite uma mensagem..."
            maxLength={200}
          />
          <button className="send-btn" onClick={sendMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Botão flutuante do chat */}
      {!isChatOpen && (
        <button
          className={`chat-floating-btn ${unreadMessagesCount > 0 ? 'has-notification' : ''}`}
          onClick={() => {
            setIsChatOpen(true)
            // O useEffect vai marcar as mensagens como lidas automaticamente
          }}
          title="Abrir chat ao vivo"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {/* Badge só aparece quando chat está fechado E há mensagens não lidas */}
          {unreadMessagesCount > 0 && (
            <span className="chat-notification-bell">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
          )}
          <span>Chat</span>
        </button>
      )}

      {/* Popup de confirmação para encerrar chamada */}
      {showEndCallConfirm && (
        <div className="end-call-confirm-overlay">
          <div className="end-call-confirm-modal">
            <h2 className="end-call-confirm-title">Encerrar chamada?</h2>
            <p className="end-call-confirm-warning">Tem certeza que deseja encerrar esta chamada? Esta ação não pode ser desfeita.</p>
            <div className="end-call-confirm-buttons">
              <button
                className="end-call-confirm-cancel"
                onClick={cancelEndCall}
              >
                Cancelar
              </button>
              <button
                className="end-call-confirm-continue"
                onClick={confirmEndCall}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

