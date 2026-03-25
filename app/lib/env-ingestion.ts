import { z } from 'zod'

/**
 * Conditional validation for bank-ingestion env variables.
 *
 * The system is agreement-scoped and providers can be enabled/disabled in DB.
 * Therefore we cannot require all provider env at application startup.
 *
 * Strategy:
 * - If none of a provider's env vars are set => do not error.
 * - If any env var for a provider is set => require the full minimal set.
 */

const nonEmpty = (v: unknown) => typeof v === 'string' && v.trim().length > 0

export const IngestionEnvSchema = z
  .object({
    // Danske config
    DANSKE_BANK_EDI_ENDPOINT_URL: z.string().optional(),
    DANSKE_BANK_PKI_ENDPOINT_URL: z.string().optional(),
    DANSKE_BANK_EDI_SENDER_ID: z.string().optional(),
    DANSKE_BANK_EDI_RECEIVER_ID: z.string().optional(),
    DANSKE_BANK_EDI_USER_AGENT: z.string().optional(),
    DANSKE_BANK_EDI_LANGUAGE: z.string().optional(),
    DANSKE_BANK_CUSTOMER_ID: z.string().optional(),
    DANSKE_BANK_SIGNER_ID: z.string().optional(),
    DANSKE_BANK_SOFTWARE_ID: z.string().optional(),
    DANSKE_BANK_ENVIRONMENT: z.string().optional(),
    DANSKE_BANK_PKI_SENDER_ID: z.string().optional(),
    DANSKE_BANK_PKI_CUSTOMER_ID: z.string().optional(),
    DANSKE_BANK_PKI_INTERFACE_VERSION: z.string().optional(),
    DANSKE_BANK_PKI_BANK_ROOT_CERT_SERIAL: z.string().optional(),

    // Danske secrets
    DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM: z.string().optional(),
    DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM: z.string().optional(),
    DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64: z.string().optional(),
    DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64: z.string().optional(),
    DANSKE_BANK_TRUSTED_SIGNING_CERT_SHA256: z.string().optional(),

    // Danske optional mTLS
    DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM: z.string().optional(),
    DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM: z.string().optional(),
    DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64: z.string().optional(),
    DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64: z.string().optional(),

    // Nordea config
    NORDEA_CA_WS_ENDPOINT_URL: z.string().optional(),
    NORDEA_CA_WS_SENDER_ID: z.string().optional(),
    NORDEA_CA_WS_RECEIVER_ID: z.string().optional(),
    NORDEA_CA_WS_USER_AGENT: z.string().optional(),
    NORDEA_CA_WS_LANGUAGE: z.string().optional(),
    NORDEA_CA_CUSTOMER_ID: z.string().optional(),
    NORDEA_CA_SIGNER_ID: z.string().optional(),
    NORDEA_CA_SOFTWARE_ID: z.string().optional(),
    NORDEA_CA_ENVIRONMENT: z.string().optional(),
    NORDEA_CA_STATEMENT_FILE_TYPE: z.string().optional(),
    NORDEA_CA_REQUEST_COMPRESSED: z.string().optional(),

    // Nordea secrets
    NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM: z.string().optional(),
    NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM: z.string().optional(),
    NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64: z.string().optional(),
    NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64: z.string().optional(),
    NORDEA_TRUSTED_SIGNING_CERT_SHA256: z.string().optional(),

    // Nordea optional mTLS
    NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM: z.string().optional(),
    NORDEA_MTLS_CLIENT_CERTIFICATE_PEM: z.string().optional(),
    NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM_B64: z.string().optional(),
    NORDEA_MTLS_CLIENT_CERTIFICATE_PEM_B64: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // -------------------------
    // Danske conditional requirements
    // -------------------------
    const danskeAny =
      nonEmpty(val.DANSKE_BANK_EDI_SENDER_ID) ||
      nonEmpty(val.DANSKE_BANK_CUSTOMER_ID) ||
      nonEmpty(val.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM) ||
      nonEmpty(val.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64)

    if (danskeAny) {
      const required: (keyof typeof val)[] = [
        'DANSKE_BANK_EDI_SENDER_ID',
        'DANSKE_BANK_EDI_USER_AGENT',
        'DANSKE_BANK_CUSTOMER_ID',
        'DANSKE_BANK_SIGNER_ID',
        'DANSKE_BANK_SOFTWARE_ID',
        'DANSKE_BANK_PKI_SENDER_ID',
        'DANSKE_BANK_PKI_CUSTOMER_ID',
      ]
      for (const k of required) {
        if (!nonEmpty((val as any)[k])) {
          ctx.addIssue({ code: 'custom', path: [String(k)], message: 'Required when configuring Danske Bank' })
        }
      }

      const hasKey = nonEmpty(val.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM) || nonEmpty(val.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64)
      const hasCert = nonEmpty(val.DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM) || nonEmpty(val.DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64)
      if (!hasKey) ctx.addIssue({ code: 'custom', path: ['DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64'], message: 'Missing key (PEM or *_B64)' })
      if (!hasCert) ctx.addIssue({ code: 'custom', path: ['DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64'], message: 'Missing cert (PEM or *_B64)' })

      const mtlsAny =
        nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM) ||
        nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64) ||
        nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM) ||
        nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64)
      if (mtlsAny) {
        const mtlsKey = nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM) || nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64)
        const mtlsCert = nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM) || nonEmpty(val.DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64)
        if (!mtlsKey) ctx.addIssue({ code: 'custom', path: ['DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64'], message: 'mTLS key required when any mTLS var is set' })
        if (!mtlsCert) ctx.addIssue({ code: 'custom', path: ['DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64'], message: 'mTLS cert required when any mTLS var is set' })
      }
    }

    // -------------------------
    // Nordea conditional requirements
    // -------------------------
    const nordeaAny =
      nonEmpty(val.NORDEA_CA_WS_SENDER_ID) ||
      nonEmpty(val.NORDEA_CA_CUSTOMER_ID) ||
      nonEmpty(val.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM) ||
      nonEmpty(val.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64)

    if (nordeaAny) {
      const required: (keyof typeof val)[] = [
        'NORDEA_CA_WS_SENDER_ID',
        'NORDEA_CA_WS_USER_AGENT',
        'NORDEA_CA_CUSTOMER_ID',
        'NORDEA_CA_SIGNER_ID',
        'NORDEA_CA_SOFTWARE_ID',
      ]
      for (const k of required) {
        if (!nonEmpty((val as any)[k])) {
          ctx.addIssue({ code: 'custom', path: [String(k)], message: 'Required when configuring Nordea' })
        }
      }

      const hasKey = nonEmpty(val.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM) || nonEmpty(val.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64)
      const hasCert = nonEmpty(val.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM) || nonEmpty(val.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64)
      if (!hasKey) ctx.addIssue({ code: 'custom', path: ['NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64'], message: 'Missing key (PEM or *_B64)' })
      if (!hasCert) ctx.addIssue({ code: 'custom', path: ['NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64'], message: 'Missing cert (PEM or *_B64)' })

      const mtlsAny =
        nonEmpty(val.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM) ||
        nonEmpty(val.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM_B64) ||
        nonEmpty(val.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM) ||
        nonEmpty(val.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM_B64)
      if (mtlsAny) {
        const mtlsKey = nonEmpty(val.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM) || nonEmpty(val.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM_B64)
        const mtlsCert = nonEmpty(val.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM) || nonEmpty(val.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM_B64)
        if (!mtlsKey) ctx.addIssue({ code: 'custom', path: ['NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM_B64'], message: 'mTLS key required when any mTLS var is set' })
        if (!mtlsCert) ctx.addIssue({ code: 'custom', path: ['NORDEA_MTLS_CLIENT_CERTIFICATE_PEM_B64'], message: 'mTLS cert required when any mTLS var is set' })
      }
    }
  })

export type IngestionEnv = z.infer<typeof IngestionEnvSchema>
