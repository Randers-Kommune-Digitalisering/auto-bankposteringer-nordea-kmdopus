import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'

import { loadDanskeBankEnvSecrets } from '../../engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'

const fixturePath = (name: string) =>
  new URL(`../fixtures/nordea-secure-envelope/${name}`, import.meta.url)

describe('loadDanskeBankEnvSecrets', () => {
  it('loads PEM secrets directly', async () => {
    const privateKeyPem = await readFile(fixturePath('test-private-key.pem'), 'utf8')
    const certificatePem = await readFile(fixturePath('test-certificate.pem'), 'utf8')

    const secrets = loadDanskeBankEnvSecrets({
      DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM: privateKeyPem,
      DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM: certificatePem,
    } as any)

    expect(secrets.applicationRequestPrivateKeyPem).toContain('BEGIN')
    expect(secrets.applicationRequestCertificatePem).toContain('BEGIN CERTIFICATE')
  })

  it('loads PEM secrets from base64', async () => {
    const privateKeyPem = await readFile(fixturePath('test-private-key.pem'), 'utf8')
    const certificatePem = await readFile(fixturePath('test-certificate.pem'), 'utf8')

    const secrets = loadDanskeBankEnvSecrets({
      DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64: Buffer.from(privateKeyPem, 'utf8').toString('base64'),
      DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64: Buffer.from(certificatePem, 'utf8').toString('base64'),
    } as any)

    expect(secrets.applicationRequestPrivateKeyPem).toBe(privateKeyPem)
    expect(secrets.applicationRequestCertificatePem).toBe(certificatePem)
  })

  it('fails when required secrets are missing', async () => {
    expect(() => loadDanskeBankEnvSecrets({} as any)).toThrow(/Missing Danske Bank private key|Missing Danske Bank certificate/)
  })
})
