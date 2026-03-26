import { createPublicKey, createVerify, KeyObject } from 'node:crypto'
import { request } from 'undici'

export type JwksKey = {
  kid: string
  kty: string
  alg?: string
  use?: string
  n?: string
  e?: string
  x5c?: string[]
}

type JwksResponse = { keys: JwksKey[] }

function base64UrlToBase64(input: string): string {
  return input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4)
}

function decodeBase64UrlJson<T>(input: string): T {
  const json = Buffer.from(base64UrlToBase64(input), 'base64').toString('utf8')
  return JSON.parse(json) as T
}

function parseJwtHeader(token: string): { kid?: string; alg?: string } {
  const [headerB64] = token.split('.')
  if (!headerB64) return {}
  return decodeBase64UrlJson(headerB64)
}

export class JwksClient {
  private readonly jwksUrl: string
  private cacheByKid = new Map<string, { key: KeyObject; expiresAt: number }>()
  private jwksExpiresAt = 0

  constructor(jwksUrl: string) {
    this.jwksUrl = jwksUrl
  }

  private async fetchJwks(): Promise<JwksResponse> {
    const { body, statusCode, headers } = await request(this.jwksUrl, { method: 'GET' })
    if (statusCode < 200 || statusCode >= 300) {
      const text = await body.text().catch(() => '')
      throw new Error(`JWKS fetch failed (${statusCode}): ${text}`)
    }

    const maxAgeHeader = String(headers['cache-control'] ?? '')
    const m = /max-age=(\d+)/i.exec(maxAgeHeader)
    const maxAgeSeconds = m ? Number(m[1]) : 300
    this.jwksExpiresAt = Date.now() + Math.max(30, maxAgeSeconds) * 1000

    return (await body.json()) as JwksResponse
  }

  private jwkToKeyObject(jwk: JwksKey): KeyObject {
    if (jwk.kty !== 'RSA' || !jwk.n || !jwk.e) {
      throw new Error('Unsupported JWK (expected RSA with n/e)')
    }
    return createPublicKey({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' as any })
  }

  async getKeyForToken(token: string): Promise<KeyObject> {
    const { kid } = parseJwtHeader(token)
    if (!kid) throw new Error('JWT missing kid')

    const now = Date.now()
    const cached = this.cacheByKid.get(kid)
    if (cached && cached.expiresAt > now) return cached.key

    const shouldRefresh = now >= this.jwksExpiresAt
    if (shouldRefresh) {
      this.cacheByKid.clear()
    }

    const jwks = await this.fetchJwks()
    const key = jwks.keys.find(k => k.kid === kid)
    if (!key) throw new Error(`JWKS missing kid ${kid}`)

    const keyObject = this.jwkToKeyObject(key)
    this.cacheByKid.set(kid, { key: keyObject, expiresAt: this.jwksExpiresAt })
    return keyObject
  }
}

export function verifyRs256JwtSignature(token: string, publicKey: KeyObject): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [h, p, s] = parts
  const signingInput = `${h}.${p}`
  const signature = Buffer.from(base64UrlToBase64(s), 'base64')

  const verify = createVerify('RSA-SHA256')
  verify.update(signingInput)
  verify.end()
  return verify.verify(publicKey, signature)
}

export function decodeJwtPayload<T extends object = any>(token: string): T {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  return decodeBase64UrlJson(parts[1]!)
}
