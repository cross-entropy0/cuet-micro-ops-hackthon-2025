import { useState } from 'react'
import { Bug, CheckCircle, Activity, AlertCircle, XCircle, Calendar, Code } from 'lucide-react'
import { apiClient } from '../lib/api'
import * as Sentry from '@sentry/react'

interface ErrorEvent {
  id: string
  severity: 'error' | 'warning'
  type: string
  message: string
  timestamp: string
  source: string
  userAgent: string
  url: string
}

export function SentryTest() {
  const [result, setResult] = useState<string | null>(null)
  const [errorEvents, setErrorEvents] = useState<ErrorEvent[]>([])
  const [stats, setStats] = useState({ total: 0, errors: 0, warnings: 0 })

  const captureError = (type: string, message: string, severity: 'error' | 'warning' = 'error') => {
    const event: ErrorEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      type,
      message,
      timestamp: new Date().toISOString(),
      source: type.includes('Backend') ? 'backend-api' : 'frontend-react',
      userAgent: navigator.userAgent.split(' ').slice(-2).join(' '),
      url: window.location.href
    }
    
    setErrorEvents(prev => [event, ...prev].slice(0, 5))
    setStats(prev => ({
      total: prev.total + 1,
      errors: severity === 'error' ? prev.errors + 1 : prev.errors,
      warnings: severity === 'warning' ? prev.warnings + 1 : prev.warnings
    }))
  }

  const triggerBackendError = async () => {
    try {
      await apiClient.triggerSentryTest(70000)
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { source: 'backend-test' },
      })
      
      captureError('Backend API Error', error.message || 'Internal Server Error', 'error')
      setResult(`✅ Backend error captured and sent to Sentry`)
    }
  }

  const triggerFrontendError = () => {
    try {
      throw new Error('Frontend validation failed - invalid user input')
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { source: 'frontend-test' },
      })
      
      captureError('Frontend JS Error', error.message, 'error')
      setResult('✅ Frontend error captured and sent to Sentry')
    }
  }

  return (
    <div>
      <h3><Bug /> Sentry Error Tracking</h3>
      
      {/* Stats Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          padding: '0.875rem',
          borderRadius: '10px',
          border: '1px solid #fca5a5'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>ERRORS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>{stats.errors}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          padding: '0.875rem',
          borderRadius: '10px',
          border: '1px solid #fcd34d'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>WARNINGS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>{stats.warnings}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          padding: '0.875rem',
          borderRadius: '10px',
          border: '1px solid #a5b4fc'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#3730a3', fontWeight: 600 }}>TOTAL</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5' }}>{stats.total}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={triggerBackendError} 
            style={{ 
              flex: 1,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <XCircle size={18} />
            <span>Trigger Backend Error</span>
          </button>
          <button 
            onClick={triggerFrontendError} 
            style={{ 
              flex: 1,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} />
            <span>Trigger Frontend Error</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {result && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '0.875rem 1rem', 
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          borderRadius: '10px',
          fontSize: '0.9rem',
          border: '1px solid #6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#065f46',
          fontWeight: 600
        }}>
          <CheckCircle size={18} color="#059669" />
          {result}
        </div>
      )}

      {/* Error Events List */}
      {errorEvents.length > 0 ? (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#1f2937'
            }}>
              <Activity size={18} color="#6366f1" />
              <span>Error Events</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Last 5 events</span>
          </div>
          
          {errorEvents.map((event) => (
            <div 
              key={event.id} 
              style={{ 
                background: event.severity === 'error' 
                  ? 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)'
                  : 'linear-gradient(135deg, #fff 0%, #fffbeb 100%)',
                padding: '1rem',
                borderRadius: '10px',
                marginBottom: '0.75rem',
                border: event.severity === 'error' 
                  ? '1px solid #fecaca'
                  : '1px solid #fed7aa',
                transition: 'all 0.2s'
              }}
            >
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {event.severity === 'error' ? (
                    <XCircle size={16} color="#dc2626" />
                  ) : (
                    <AlertCircle size={16} color="#d97706" />
                  )}
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: '0.9rem',
                    color: event.severity === 'error' ? '#991b1b' : '#92400e'
                  }}>
                    {event.type}
                  </span>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: event.source === 'backend-api' ? '#dbeafe' : '#fce7f3',
                    color: event.source === 'backend-api' ? '#1e40af' : '#9f1239'
                  }}>
                    {event.source}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.375rem',
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  <Calendar size={12} />
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Message */}
              <div style={{ 
                fontSize: '0.85rem',
                color: '#374151',
                marginBottom: '0.75rem',
                fontWeight: 500
              }}>
                {event.message}
              </div>

              {/* Metadata */}
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Code size={12} />
                  <span>{event.userAgent}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                  ID: {event.id.slice(0, 16)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: '10px',
          border: '1px dashed #d1d5db',
          color: '#6b7280'
        }}>
          <Bug size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
          <div style={{ fontSize: '0.9rem' }}>No errors captured yet</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Click buttons above to test error tracking
          </div>
        </div>
      )}

      {/* Features Footer */}
      <div style={{ 
        marginTop: '1.5rem',
        padding: '1rem', 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
        borderRadius: '10px',
        border: '1px solid #bae6fd',
        fontSize: '0.8rem'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#0369a1', fontSize: '0.85rem' }}>
          ✅ Integrated Features:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {['Error Boundary', 'API Auto-capture', 'User Feedback', 'Performance', 'Custom Logging'].map(feature => (
            <span 
              key={feature}
              style={{
                padding: '0.25rem 0.625rem',
                background: 'white',
                borderRadius: '6px',
                fontSize: '0.75rem',
                border: '1px solid #7dd3fc',
                color: '#0c4a6e',
                fontWeight: 600
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
