import { afterEach, describe, expect, it } from 'vitest'
import { readFile, rm, stat } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import {
  formatOidcSecrets,
  generateOidcSecrets,
  writeOidcSecretsFile,
} from '../../scripts/security/generate-oidc-secrets'

describe('OIDC secret generator', () => {
  const generatedFiles: string[] = []

  afterEach(async () => {
    await Promise.all(generatedFiles.splice(0).map(path => rm(path, { force: true })))
  })

  it('generates independent session secrets and a 256-bit base64 token key', () => {
    const secrets = generateOidcSecrets()

    expect(secrets.NUXT_OIDC_SESSION_SECRET).toMatch(/^[A-Za-z0-9_-]{48}$/)
    expect(secrets.NUXT_OIDC_AUTH_SESSION_SECRET).toMatch(/^[A-Za-z0-9_-]{48}$/)
    expect(secrets.NUXT_OIDC_AUTH_SESSION_SECRET).not.toBe(secrets.NUXT_OIDC_SESSION_SECRET)
    expect(Buffer.from(secrets.NUXT_OIDC_TOKEN_KEY, 'base64')).toHaveLength(32)
    expect(Buffer.from(secrets.NUXT_OIDC_TOKEN_KEY, 'base64').toString('base64')).toBe(secrets.NUXT_OIDC_TOKEN_KEY)
  })

  it('formats env assignments without extra output', () => {
    expect(formatOidcSecrets({
      NUXT_OIDC_SESSION_SECRET: 'session',
      NUXT_OIDC_TOKEN_KEY: 'token',
      NUXT_OIDC_AUTH_SESSION_SECRET: 'auth',
    })).toBe([
      'NUXT_OIDC_SESSION_SECRET=session',
      'NUXT_OIDC_TOKEN_KEY=token',
      'NUXT_OIDC_AUTH_SESSION_SECRET=auth',
      '',
    ].join('\n'))
  })

  it('writes only to the secret directory, uses restrictive permissions, and refuses overwrite', async () => {
    const outputFile = `.secrets/oidc/test-${randomUUID()}.env`
    const secrets = generateOidcSecrets()
    const outputPath = await writeOidcSecretsFile(outputFile, secrets)
    generatedFiles.push(outputPath)

    const fileStat = await stat(outputPath)
    expect(fileStat.mode & 0o777).toBe(0o600)
    expect(await readFile(outputPath, 'utf8')).toBe(formatOidcSecrets(secrets))
    await expect(writeOidcSecretsFile(outputFile, generateOidcSecrets())).rejects.toThrow()
    await expect(writeOidcSecretsFile('../outside.env', secrets)).rejects.toThrow(/inside \.secrets\/oidc/)
  })
})