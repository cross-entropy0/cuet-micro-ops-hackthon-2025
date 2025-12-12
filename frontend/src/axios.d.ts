import 'axios'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      spanContext?: any
      startTime?: number
    }
  }
}
