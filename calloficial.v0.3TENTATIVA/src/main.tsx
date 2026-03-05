import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { VideoCall } from './components/VideoCall'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VideoCall />
  </StrictMode>,
)

