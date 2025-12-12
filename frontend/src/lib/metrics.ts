import { useState, useEffect } from 'react'

export interface APIMetrics {
  totalRequests: number
  successCount: number
  failureCount: number
  averageResponseTime: number
  successRate: number
}

const metricsStore = {
  requests: [] as { timestamp: number; duration: number; success: boolean }[],
}

export const recordAPICall = (duration: number, success: boolean) => {
  metricsStore.requests.push({
    timestamp: Date.now(),
    duration,
    success,
  })
  
  if (metricsStore.requests.length > 100) {
    metricsStore.requests.shift()
  }
}

export const useMetrics = (): APIMetrics => {
  const [metrics, setMetrics] = useState<APIMetrics>({
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    averageResponseTime: 0,
    successRate: 0,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const { requests } = metricsStore
      const totalRequests = requests.length
      const successCount = requests.filter(r => r.success).length
      const failureCount = totalRequests - successCount
      const averageResponseTime = totalRequests > 0
        ? requests.reduce((sum, r) => sum + r.duration, 0) / totalRequests
        : 0
      const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0

      setMetrics({
        totalRequests,
        successCount,
        failureCount,
        averageResponseTime,
        successRate,
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return metrics
}
