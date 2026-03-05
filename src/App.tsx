import { useState, useEffect, useRef, useCallback } from 'react'
import ProfileCard from './components/ProfileCard/ProfileCard'
import WelcomePopup from './components/WelcomePopup/WelcomePopup'
import RegisterForm from './components/RegisterForm/RegisterForm'
import VideoCall from './components/VideoCall/VideoCall'
import ClosePage from './components/ClosePage/ClosePage'
import { mockUser } from './data/mockUser'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [showTimedPopup, setShowTimedPopup] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
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
      schedulePopup(45000) // 45 seconds
      // Meta Pixel: ViewContent on ProfileCard (grid 3x3)
      if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent', { content_name: 'Perfil Julia' })
    }
  }, [entered, schedulePopup])

  // When user dismisses with X, re-show in 2 minutes
  const handleDismiss = () => {
    setShowTimedPopup(false)
    isFirstPopup.current = false
    schedulePopup(90000) // 90 seconds
  }

  // When user clicks CTA, show registration form
  const handleAccept = () => {
    setShowTimedPopup(false)
    hasClickedEnter.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    setShowRegister(true)
  }

  // Listen for "Entrar" button click → show registration form
  const handleEnterClick = () => {
    hasClickedEnter.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    setShowRegister(true)
  }

  // After registration, enter the video call
  const handleRegisterSubmit = (data: { nickname: string; contact: string; birthDate: string }) => {
    console.log('[Register]', data)
    // Meta Pixel: Lead on registration
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: 'Cadastro Perfil' })
    setShowRegister(false)
    setInCall(true)
  }

  // Attach a click listener on the AudioRoomBanner "Entrar" button
  useEffect(() => {
    if (!entered || inCall) return
    const observer = new MutationObserver(() => {
      const btn = document.querySelector('.audio-room-banner__btn')
      if (btn) {
        btn.addEventListener('click', handleEnterClick)
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const btn = document.querySelector('.audio-room-banner__btn')
    if (btn) {
      btn.addEventListener('click', handleEnterClick)
      observer.disconnect()
    }
    return () => observer.disconnect()
  }, [entered, inCall])

  // If showing close page, render it
  if (showClosePage) {
    return <ClosePage />
  }

  // If in video call, render VideoCall fullscreen
  if (inCall) {
    return <VideoCall onExit={() => setInCall(false)} onOpenClose={() => setShowClosePage(true)} />
  }

  // Registration form overlay
  if (showRegister) {
    return <RegisterForm onSubmit={handleRegisterSubmit} />
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
          <ProfileCard user={mockUser} />
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
