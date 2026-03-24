import { z } from 'zod'

/**
 * Non-secret env config for Danske Bank Web Services.
 *
 * Keep this separate from secret loading (private keys/certs).
 */

const schema = z.object({
  DANSKE_BANK_EDI_ENDPOINT_URL: z
    .string()
    .url()
    .optional()
    .default('https://businessws.danskebank.com/financialservice/edifileservice.asmx'),
  DANSKE_BANK_PKI_ENDPOINT_URL: z
    .string()
    .url()
    .optional()
    .default('https://businessws.danskebank.com/ra/pkiservice.asmx'),

  DANSKE_BANK_EDI_SENDER_ID: z.string().min(1),
  DANSKE_BANK_EDI_RECEIVER_ID: z.string().min(1).optional().default('Danske Bank'),
  DANSKE_BANK_EDI_USER_AGENT: z.string().min(1),
  DANSKE_BANK_EDI_LANGUAGE: z.string().min(1).optional().default('EN'),

  DANSKE_BANK_CUSTOMER_ID: z.string().min(1).max(16),
  DANSKE_BANK_SIGNER_ID: z.string().min(1).max(80),
  DANSKE_BANK_SOFTWARE_ID: z.string().min(1).max(80),
  DANSKE_BANK_ENVIRONMENT: z.enum(['TEST', 'PRODUCTION']).optional().default('TEST'),

  // PKIWS RequestHeader
  DANSKE_BANK_PKI_SENDER_ID: z.string().min(1),
  DANSKE_BANK_PKI_CUSTOMER_ID: z.string().min(1),
  DANSKE_BANK_PKI_INTERFACE_VERSION: z.string().min(1).optional().default('1'),
  DANSKE_BANK_PKI_BANK_ROOT_CERT_SERIAL: z.string().min(1).optional().default('1111130003'),
})

export type DanskeBankEdiEnvConfig = z.infer<typeof schema>

export function loadDanskeBankEdiEnvConfig(env: NodeJS.ProcessEnv = process.env): DanskeBankEdiEnvConfig {
  return schema.parse(env)
}
