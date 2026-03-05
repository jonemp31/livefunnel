import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0a0a',
          color: '#a1a1aa',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
          padding: '1rem',
        }}>
          <div>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Algo deu errado 😕</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#e879f9',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.5rem',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
