import { Activity } from 'lucide-react'
import { useMetrics } from '../lib/metrics'

export function MetricsDashboard() {
  const metrics = useMetrics()

  const metricCards = [
    {
      label: 'Total Requests',
      value: metrics.totalRequests,
      gradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
      border: '#a5b4fc',
      color: '#4338ca',
      icon: '📊'
    },
    {
      label: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      border: '#6ee7b7',
      color: '#065f46',
      icon: '✓'
    },
    {
      label: 'Avg Response',
      value: `${metrics.averageResponseTime.toFixed(0)}ms`,
      gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      border: '#93c5fd',
      color: '#1e40af',
      icon: '⚡'
    },
    {
      label: 'Failed',
      value: metrics.failureCount,
      gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      border: '#fca5a5',
      color: '#991b1b',
      icon: '✗'
    }
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {metricCards.map((card, index) => (
          <div
            key={index}
            style={{
              padding: '1.25rem',
              background: card.gradient,
              borderRadius: '12px',
              border: `2px solid ${card.border}`,
              transition: 'transform 0.2s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: card.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {card.label}
              </div>
              <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: card.color, lineHeight: '1' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '1rem',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <Activity size={16} color="#6366f1" />
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Real-time analytics from <strong>{metrics.totalRequests}</strong> API calls
        </span>
      </div>
    </div>
  )
}
