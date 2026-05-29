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

  // If omitted, defaults to DANSKE_BANK_PKI_SENDER_ID.
  DANSKE_BANK_EDI_SENDER_ID: z.string().min(1).optional(),
  DANSKE_BANK_EDI_RECEIVER_ID: z.string().min(1).optional().default('Danske Bank'),
  DANSKE_BANK_EDI_LANGUAGE: z.string().min(1).optional().default('EN'),

  // If omitted, defaults to DANSKE_BANK_PKI_CUSTOMER_ID.
  DANSKE_BANK_CUSTOMER_ID: z.string().min(1).max(16).optional(),
  // TargetId in the BXD ApplicationRequest (some docs call this SignerId).
  // If omitted, we default to customer id to keep onboarding friction low.
  DANSKE_BANK_SIGNER_ID: z.string().min(1).max(80).optional(),
  DANSKE_BANK_SOFTWARE_ID: z.string().min(1).max(80),
  DANSKE_BANK_ENVIRONMENT: z.enum(['TEST', 'PRODUCTION']).optional().default('TEST'),
  DANSKE_BANK_FILE_STATUS: z.enum(['NEW', 'DLD', 'ALL']).optional().default('NEW'),
  DANSKE_BANK_LOOKBACK_DAYS: z.coerce.number().int().min(1).max(365).optional().default(7),

  // PKIWS RequestHeader
  DANSKE_BANK_PKI_SENDER_ID: z.string().min(1),
  DANSKE_BANK_PKI_CUSTOMER_ID: z.string().min(1),
  DANSKE_BANK_PKI_INTERFACE_VERSION: z.string().min(1).optional().default('1'),
  DANSKE_BANK_PKI_BANK_ROOT_CERT_SERIAL: z.string().min(1).optional().default('1111110003'),
})

export type DanskeBankEdiEnvConfig = z.infer<typeof schema> & {
  DANSKE_BANK_EDI_SENDER_ID: string
  DANSKE_BANK_CUSTOMER_ID: string
  DANSKE_BANK_SIGNER_ID: string
}

export function loadDanskeBankEdiEnvConfig(env: NodeJS.ProcessEnv = process.env): DanskeBankEdiEnvConfig {
  const parsed = schema.parse(env)

  const senderId = parsed.DANSKE_BANK_EDI_SENDER_ID ?? parsed.DANSKE_BANK_PKI_SENDER_ID
  const customerId = parsed.DANSKE_BANK_CUSTOMER_ID ?? parsed.DANSKE_BANK_PKI_CUSTOMER_ID

  return {
    ...parsed,
    DANSKE_BANK_EDI_SENDER_ID: senderId,
    DANSKE_BANK_CUSTOMER_ID: customerId,
    DANSKE_BANK_SIGNER_ID: parsed.DANSKE_BANK_SIGNER_ID ?? customerId,
  }
}
