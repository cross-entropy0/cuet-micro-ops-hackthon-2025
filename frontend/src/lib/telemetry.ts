import * as Sentry from '@sentry/react'

export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  return Sentry.startSpan(
    {
      name: action,
      op: 'user.interaction',
      attributes: metadata || {},
    },
    (span) => {
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          span?.setAttribute(key, value)
        })
      }
      return span
    }
  )
}
