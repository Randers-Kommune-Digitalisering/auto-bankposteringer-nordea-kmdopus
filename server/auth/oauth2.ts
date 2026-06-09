type OAuth2GrantType = 'client_credentials' | 'refresh_token'

type OAuth2TokenResponse = {
  access_token?: string
  expires_in?: number | string
  refresh_token?: string
  refresh_expires_in?: number | string
}

export type OAuth2TokenProviderOptions = {
  tokenUrl: string
  clientId: string
  clientSecret: string
  refreshToken?: string | null
  extraParams?: Record<string, string>
  timeoutMs?: number
}

function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export class OAuth2TokenProvider {
  private readonly tokenUrl: string
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly extraParams: Record<string, string>
  private readonly timeoutMs: number

  private accessToken: string | null = null
  private expTs = 0
  private refreshToken: string | null
  private refreshExpTs = 0

  private lock: Promise<void> = Promise.resolve()

  constructor(options: OAuth2TokenProviderOptions) {
    this.tokenUrl = options.tokenUrl
    this.clientId = options.clientId
    this.clientSecret = options.clientSecret
    this.refreshToken = options.refreshToken ?? null
    this.extraParams = options.extraParams ?? {}
    this.timeoutMs = options.timeoutMs ?? 10_000
  }

  private now(): number {
    return Math.floor(Date.now() / 1000)
  }

  private isExpired(skew = 30): boolean {
    return this.now() >= this.expTs - skew
  }

  private isRefreshExpired(skew = 30): boolean {
    if (!this.refreshToken || !this.refreshExpTs) return true
    return this.now() >= this.refreshExpTs - skew
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.lock.then(fn, fn)
    this.lock = run.then(() => undefined, () => undefined)
    return run
  }

  private async requestToken(grantType: OAuth2GrantType, extraData: Record<string, string> = {}): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const params = new URLSearchParams({
        grant_type: grantType,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        ...this.extraParams,
        ...extraData,
      })

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: params,
        signal: controller.signal,
      })

      const text = await response.text()
      if (!response.ok) {
        throw new Error(`OAuth token request failed (${response.status}): ${text.slice(0, 500)}`)
      }

      const token = JSON.parse(text) as OAuth2TokenResponse
      if (typeof token.access_token !== 'string' || token.access_token.length === 0) {
        throw new Error(`Token response from ${this.tokenUrl} missing access_token`)
      }

      const expiresIn = toInt(token.expires_in)
      if (expiresIn == null) {
        throw new Error(`Token response from ${this.tokenUrl} missing expires_in`)
      }

      this.accessToken = token.access_token
      this.expTs = this.now() + expiresIn
      this.refreshToken = token.refresh_token ?? this.refreshToken

      if (this.refreshToken) {
        const refreshExpiresIn = toInt(token.refresh_expires_in)
        if (refreshExpiresIn == null) {
          throw new Error(
            `Token response from ${this.tokenUrl} missing refresh_expires_in when refresh_token is present`,
          )
        }
        this.refreshExpTs = this.now() + refreshExpiresIn
      } else {
        this.refreshExpTs = 0
      }

      return this.accessToken
    } finally {
      clearTimeout(timeout)
    }
  }

  async acquire(): Promise<string> {
    return this.withLock(() => this.requestToken('client_credentials'))
  }

  async refresh(): Promise<string> {
    return this.withLock(async () => {
      if (this.refreshToken && !this.isRefreshExpired()) {
        try {
          return await this.requestToken('refresh_token', { refresh_token: this.refreshToken })
        } catch {
          return this.requestToken('client_credentials')
        }
      }

      return this.requestToken('client_credentials')
    })
  }

  async getToken(): Promise<string> {
    return this.withLock(async () => {
      if (!this.accessToken) return this.requestToken('client_credentials')
      if (this.isExpired()) {
        if (this.refreshToken && !this.isRefreshExpired()) {
          try {
            return await this.requestToken('refresh_token', { refresh_token: this.refreshToken })
          } catch {
            return this.requestToken('client_credentials')
          }
        }

        return this.requestToken('client_credentials')
      }
      return this.accessToken
    })
  }
}

export type BearerAuthClientOptions =
  | {
      tokenProvider: OAuth2TokenProvider
    }
  | {
      tokenProvider?: never
      tokenUrl: string
      clientId: string
      clientSecret: string
      refreshToken?: string
      extraParams?: Record<string, string>
      timeoutMs?: number
    }

export class BearerAuthClient {
  readonly tokenProvider: OAuth2TokenProvider

  constructor(options: BearerAuthClientOptions) {
    if ('tokenProvider' in options && options.tokenProvider) {
      this.tokenProvider = options.tokenProvider
      return
    }

    this.tokenProvider = new OAuth2TokenProvider({
      tokenUrl: options.tokenUrl,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      refreshToken: options.refreshToken,
      extraParams: options.extraParams,
      timeoutMs: options.timeoutMs,
    })
  }

  async fetch(input: string, init: RequestInit = {}, retryOnAuthError = true): Promise<Response> {
    const token = await this.tokenProvider.getToken()
    const headers = new Headers(init.headers)
    headers.set('authorization', `Bearer ${token}`)

    const response = await fetch(input, { ...init, headers })
    if (retryOnAuthError && (response.status === 401 || response.status === 403)) {
      await this.tokenProvider.refresh()
      const refreshedToken = await this.tokenProvider.getToken()
      const retryHeaders = new Headers(init.headers)
      retryHeaders.set('authorization', `Bearer ${refreshedToken}`)
      return fetch(input, { ...init, headers: retryHeaders })
    }

    return response
  }
}