import * as Sentry from '@sentry/react'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  eventId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, eventId: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, eventId: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    Sentry.withScope((scope) => {
      scope.setContext('react', errorInfo as any)
      const eventId = Sentry.captureException(error)
      this.setState({ eventId })
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>❌ Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null, eventId: null })}>
            Try Again
          </button>
          {this.state.eventId && (
            <button
              onClick={() => {
                Sentry.showReportDialog({ eventId: this.state.eventId! })
              }}
              style={{ marginLeft: '0.5rem' }}
            >
              Report Feedback
            </button>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
