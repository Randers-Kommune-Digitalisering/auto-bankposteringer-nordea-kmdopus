import crypto from 'node:crypto'

export type NordeaRestRequestBody =
  | { contentType: 'application/json'; data: unknown }
  | {
      contentType: 'application/x-www-form-urlencoded'
      data: Record<string, string | number | boolean | null | undefined>
    }

export type NordeaRestAuthTokens = {
  accessToken: string
  refreshToken: string | null
}

function toRfc1123Utc(date: Date): string {
  return date.toUTCString()
}

function buildQueryString(pairs: Array<[string, string | null | undefined]>): string {
  const filtered = pairs.filter(([, v]) => v != null && String(v).length > 0) as Array<[string, string]>
  if (!filtered.length) return ''
  return `?${filtered.map(([k, v]) => `${k}=${v}`).join('&')}`
}

function stableJsonStringify(value: unknown): string {
  if (value === undefined) return 'null'
  if (value == null) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map((v) => stableJsonStringify(v)).join(',')}]`

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableJsonStringify(obj[k])}`)
  return `{${entries.join(',')}}`
}

export function serializeNordeaRestRequestBody(
  body: NordeaRestRequestBody | null,
): { contentType?: string; bodyText: string } {
  if (!body) return { bodyText: '' }

  if (body.contentType === 'application/json') {
    return { contentType: body.contentType, bodyText: stableJsonStringify(body.data) }
  }

  const pairs = Object.keys(body.data)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((k) => [k, body.data[k]] as const)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v ?? ''}`)

  return { contentType: body.contentType, bodyText: pairs.join('&') }
}

export function computeSha256DigestHeader(bodyText: string): string {
  const hash = crypto.createHash('sha256').update(bodyText, 'utf8').digest('base64')
  return `sha-256=${hash}`
}

export function buildNordeaHttpSignature(options: {
  method: string
  pathWithQuery: string
  host: string
  dateRfc1123: string
  privateKeyPem: string
  contentType?: string
  digestHeader?: string
}): {
  headersList: string
  normalizedString: string
  signatureBase64: string
} {
  const methodLower = options.method.toLowerCase()

  const requestWithoutContentHeaders = '(request-target) x-nordea-originating-host x-nordea-originating-date'
  const requestWithContentHeaders =
    '(request-target) x-nordea-originating-host x-nordea-originating-date content-type digest'

  const hasContentHeaders = Boolean(options.contentType && options.digestHeader)
  const headersList = hasContentHeaders ? requestWithContentHeaders : requestWithoutContentHeaders

  let normalizedString =
    `(request-target): ${methodLower} ${options.pathWithQuery}\n` +
    `x-nordea-originating-host: ${options.host}\n` +
    `x-nordea-originating-date: ${options.dateRfc1123}`

  if (hasContentHeaders) {
    normalizedString += `\ncontent-type: ${options.contentType}\ndigest: ${options.digestHeader}`
  }

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(normalizedString, 'utf8')
  signer.end()
  const signatureBase64 = signer.sign(options.privateKeyPem, 'base64')

  return { headersList, normalizedString, signatureBase64 }
}

export class NordeaCorporateRestClient {
  readonly host: string
  readonly clientId: string
  readonly clientSecret: string
  readonly eidasPrivateKeyPem: string
  readonly timeoutMs: number

  constructor(input: {
    host: string
    clientId: string
    clientSecret: string
    eidasPrivateKeyPem: string
    timeoutMs: number
  }) {
    this.host = input.host
    this.clientId = input.clientId
    this.clientSecret = input.clientSecret
    this.eidasPrivateKeyPem = input.eidasPrivateKeyPem
    this.timeoutMs = input.timeoutMs
  }

  private async request<T>(input: {
    method: 'GET' | 'POST' | 'PUT'
    path: string
    urlParam?: string | null
    pathSuffix?: string | null
    queryPairs?: Array<[string, string | null | undefined]>
    bearerToken?: string | null
    body?: NordeaRestRequestBody | null
  }): Promise<{ status: number; data: T; headers: Headers }> {
    const urlParam = input.urlParam ? `/${input.urlParam}` : ''
    const suffix = input.pathSuffix ?? ''
    const queryString = buildQueryString(input.queryPairs ?? [])

    const pathWithQuery = `${input.path}${urlParam}${suffix}${queryString}`
    const url = `https://${this.host}${pathWithQuery}`

    const dateRfc1123 = toRfc1123Utc(new Date())

    const { contentType, bodyText } = serializeNordeaRestRequestBody(input.body ?? null)

    const headers: Record<string, string> = {
      'X-Nordea-Originating-Host': this.host,
      'X-Nordea-Originating-Date': dateRfc1123,
      'X-IBM-Client-Id': this.clientId,
      'X-IBM-Client-Secret': this.clientSecret,
    }

    let digestHeader: string | undefined
    if (contentType) {
      digestHeader = computeSha256DigestHeader(bodyText)
      headers['Content-Type'] = contentType
      headers['Digest'] = digestHeader
    }

    const sig = buildNordeaHttpSignature({
      method: input.method,
      pathWithQuery,
      host: this.host,
      dateRfc1123,
      privateKeyPem: this.eidasPrivateKeyPem,
      contentType,
      digestHeader,
    })

    headers['Signature'] = `keyId="${this.clientId}",algorithm="rsa-sha256",headers="${sig.headersList}",signature="${sig.signatureBase64}"`

    if (input.bearerToken) {
      headers['Authorization'] = `Bearer ${input.bearerToken}`
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(url, {
        method: input.method,
        headers,
        body: contentType ? bodyText : undefined,
        signal: controller.signal,
      })

      const contentTypeHeader = res.headers.get('content-type') ?? ''
      const text = await res.text()

      if (!res.ok) {
        throw new Error(`Nordea REST HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
      }

      const data = (contentTypeHeader.includes('application/json') ? JSON.parse(text) : (text as any)) as T
      return { status: res.status, data, headers: res.headers }
    } finally {
      clearTimeout(timeout)
    }
  }

  async initiateAuthorization(input: {
    agreementNumber: string
    durationSeconds: number
    scopes: string[]
  }): Promise<{ status: string | null; accessId: string | null; clientToken: string | null; raw: unknown }> {
    const body: NordeaRestRequestBody = {
      contentType: 'application/json',
      data: {
        scope: input.scopes,
        duration: input.durationSeconds,
        agreement_number: input.agreementNumber,
      },
    }

    const res = await this.request<any>({ method: 'POST', path: '/corporate/v2/authorize', body })
    const r = (res.data as any)?.response

    return {
      status: typeof r?.status === 'string' ? r.status : null,
      accessId: typeof r?.access_id === 'string' ? r.access_id : null,
      clientToken: typeof r?.client_token === 'string' ? r.client_token : null,
      raw: res.data,
    }
  }

  async confirmAuthorization(input: {
    accessId: string
    authorizerId: string
    bearerToken: string
  }): Promise<{ status: string | null; raw: unknown }> {
    const body: NordeaRestRequestBody = {
      contentType: 'application/json',
      data: { authorizer_id: input.authorizerId },
    }

    const res = await this.request<any>({
      method: 'PUT',
      path: '/corporate/v2/authorize',
      urlParam: input.accessId,
      bearerToken: input.bearerToken,
      body,
    })

    const r = (res.data as any)?.response
    return {
      status: typeof r?.status === 'string' ? r.status : null,
      raw: res.data,
    }
  }

  async getAuthorizationStatus(input: {
    accessId: string
    bearerToken?: string | null
  }): Promise<{ status: string | null; code: string | null; raw: unknown }> {
    const res = await this.request<any>({
      method: 'GET',
      path: '/corporate/v2/authorize',
      urlParam: input.accessId,
      bearerToken: input.bearerToken ?? null,
    })

    const r = (res.data as any)?.response
    return {
      status: typeof r?.status === 'string' ? r.status : null,
      code: typeof r?.code === 'string' ? r.code : null,
      raw: res.data,
    }
  }

  async exchangeAuthorizationCodeForTokens(input: {
    code: string
  }): Promise<{ tokens: NordeaRestAuthTokens; raw: unknown }> {
    const body: NordeaRestRequestBody = {
      contentType: 'application/x-www-form-urlencoded',
      data: {
        code: input.code,
        grant_type: 'authorization_code',
      },
    }

    const res = await this.request<any>({ method: 'POST', path: '/corporate/v2/authorize/token', body })
    const r = (res.data as any)?.response

    const accessToken = typeof r?.access_token === 'string' ? r.access_token : null
    if (!accessToken) throw new Error('Nordea REST token response missing access_token')

    const refreshToken = typeof r?.refresh_token === 'string' ? r.refresh_token : null

    return {
      tokens: { accessToken, refreshToken },
      raw: res.data,
    }
  }

  async refreshAccessToken(input: {
    refreshToken: string
  }): Promise<{ tokens: NordeaRestAuthTokens; raw: unknown }> {
    const body: NordeaRestRequestBody = {
      contentType: 'application/x-www-form-urlencoded',
      data: {
        grant_type: 'refresh_token',
        refresh_token: input.refreshToken,
      },
    }

    const res = await this.request<any>({ method: 'POST', path: '/corporate/v2/authorize/token', body })
    const r = (res.data as any)?.response

    const accessToken = typeof r?.access_token === 'string' ? r.access_token : null
    if (!accessToken) throw new Error('Nordea REST refresh response missing access_token')

    const refreshToken = typeof r?.refresh_token === 'string' ? r.refresh_token : input.refreshToken

    return {
      tokens: { accessToken, refreshToken },
      raw: res.data,
    }
  }

  async listAccounts(input: {
    bearerToken: string
  }): Promise<{ accounts: unknown[]; raw: unknown }> {
    const res = await this.request<any>({
      method: 'GET',
      path: '/corporate/premium/v4/accounts',
      bearerToken: input.bearerToken,
    })
    const r = (res.data as any)?.response
    const accounts = Array.isArray(r?.accounts) ? r.accounts : Array.isArray(r?.account_list) ? r.account_list : []
    return { accounts, raw: res.data }
  }

  async listTransactions(input: {
    bearerToken: string
    accountRef: string
    fromDate: string
    toDate: string
    continuationKey?: string | null
  }): Promise<{ transactions: unknown[]; continuationKey: string | null; raw: unknown }> {
    const res = await this.request<any>({
      method: 'GET',
      path: '/corporate/premium/v4/accounts',
      urlParam: input.accountRef,
      pathSuffix: '/transactions',
      bearerToken: input.bearerToken,
      queryPairs: [
        ['from_date', input.fromDate],
        ['to_date', input.toDate],
        ['continuation_key', input.continuationKey ?? null],
      ],
    })

    const r = (res.data as any)?.response
    const txs = Array.isArray(r?.transactions) ? r.transactions : []
    const continuationKey = typeof r?.continuation_key === 'string' ? r.continuation_key : null

    return { transactions: txs, continuationKey, raw: res.data }
  }
}
