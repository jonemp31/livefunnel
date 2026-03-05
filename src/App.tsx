import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import ProfileCard from './components/ProfileCard/ProfileCard'
import WelcomePopup from './components/WelcomePopup/WelcomePopup'
import { mockUser } from './data/mockUser'

// Lazy-loaded heavy components (code splitting)
const RegisterForm = lazy(() => import('./components/RegisterForm/RegisterForm'))
const VideoCall = lazy(() => import('./components/VideoCall/VideoCall'))
const ClosePage = lazy(() => import('./components/ClosePage/ClosePage'))

// Prefetch helpers — download chunk in background so it's instant when needed
const prefetchRegisterForm = () => { import('./components/RegisterForm/RegisterForm') }
const prefetchVideoCall = () => { import('./components/VideoCall/VideoCall') }
const prefetchClosePage = () => { import('./components/ClosePage/ClosePage') }

export default function App() {
  const [entered, setEntered] = useState(false)
  const [showTimedPopup, setShowTimedPopup] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [showClosePage, setShowClosePage] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasClickedEnter = useRef(false)
  const isFirstPopup = useRef(true)

  // Meta Pixel: PageView on pressel (initial load)
  useEffect(() => {
    if (typeof window.fbq === 'function') window.fbq('track', 'PageView')
  }, [])

  const schedulePopup = useCallback((delayMs: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!hasClickedEnter.current) {
        console.log('[Popup] Showing timed popup')
        setShowTimedPopup(true)
      }
    }, delayMs)
  }, [])

  // Start timer once user enters the page
  useEffect(() => {
    if (entered && !hasClickedEnter.current) {
      schedulePopup(20000) // 20 seconds
      // Meta Pixel: ViewContent on ProfileCard (grid 3x3)
      if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent', { content_name: 'Perfil Julia' })
      // Prefetch next steps while user browses the profile
      prefetchRegisterForm()
      prefetchVideoCall()
    }
  }, [entered, schedulePopup])

  // When user dismisses with X, re-show in 2 minutes
  const handleDismiss = () => {
    setShowTimedPopup(false)
    isFirstPopup.current = false
    schedulePopup(45000) // 45 seconds
  }

  // When user clicks CTA → go directly to VideoCall
  const handleAccept = () => {
    setShowTimedPopup(false)
    hasClickedEnter.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    setInCall(true)
  }

  // Listen for "Entrar" button click → go directly to VideoCall
  const handleEnterClick = () => {
    hasClickedEnter.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    setInCall(true)
  }

  // Prefetch ClosePage as soon as VideoCall is shown
  useEffect(() => {
    if (inCall) prefetchClosePage()
  }, [inCall])

  // If showing close page, render it
  if (showClosePage) {
    return <Suspense fallback={null}><ClosePage /></Suspense>
  }

  // If in video call, render VideoCall fullscreen
  if (inCall) {
    return <Suspense fallback={null}><VideoCall onExit={() => setInCall(false)} onOpenClose={() => setShowClosePage(true)} /></Suspense>
  }

  return (
    <div className="app-container">
      {!entered ? (
        <WelcomePopup
          avatarUrl={mockUser.avatarUrl}
          name={mockUser.name}
          smallBtn
          onClose={() => setEntered(true)}
        />
      ) : (
        <>
          <ProfileCard user={mockUser} onEnterClick={handleEnterClick} />
          {showTimedPopup && (
            <WelcomePopup
              avatarUrl={mockUser.avatarUrl}
              name={mockUser.name}
              title={"Amor, estou ao vivo agora...\nQuer me ver? 🙈"}
              buttonText="Toque para assistir AO VIVO"
              showClose
              pulseBtn={isFirstPopup.current}
              subCta="entrar na sala ao vivo"
              onClose={handleAccept}
              onDismiss={handleDismiss}
            />
          )}
        </>
      )}
    </div>
  )
}
