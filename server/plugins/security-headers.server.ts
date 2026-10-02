import { defineNitroPlugin } from 'nitropack/runtime'
import { setResponseHeader } from 'h3'

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
].join('; ')

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
    setResponseHeader(event, 'X-Frame-Options', 'DENY')
    setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
    setResponseHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    setResponseHeader(event, 'Content-Security-Policy-Report-Only', contentSecurityPolicy)
  })
})