import { z } from 'zod'

/**
 * Non-secret env config for Nordea Corporate Access Web Services.
 *
 * Secrets (private key/certificate) are loaded via `loadNordeaEnvSecrets`.
 */

const schema = z.object({
  /** CorporateFileService endpoint (production default from Nordea WSDL). */
  NORDEA_CA_WS_ENDPOINT_URL: z
    .string()
    .url()
    .default('https://ws.ebridge.prod.nordea.com/ws/CorporateFileService'),

  /** SOAP RequestHeader fields (agreement-managed). */
  NORDEA_CA_WS_SENDER_ID: z.string().min(1),
  NORDEA_CA_WS_RECEIVER_ID: z.string().min(1).default('Nordea'),
  NORDEA_CA_WS_USER_AGENT: z.string().min(1),
  NORDEA_CA_WS_LANGUAGE: z.enum(['EN', 'SV', 'FI']).default('EN'),

  /** Secure Envelope (ApplicationRequest) fields. */
  NORDEA_CA_CUSTOMER_ID: z.string().min(1).max(16),
  NORDEA_CA_SIGNER_ID: z.string().min(1).max(80),
  NORDEA_CA_SOFTWARE_ID: z.string().min(1).max(80),
  NORDEA_CA_ENVIRONMENT: z.enum(['PRODUCTION', 'TEST']).default('TEST'),

  /** Prefer extended CAMT.053 as per Nordea Secure Envelope Appendix B. */
  NORDEA_CA_STATEMENT_FILE_TYPE: z.string().min(1).default('NDAREXXMLO'),

  /** Optional: request compressed payload in DownloadFile (recommended). */
  NORDEA_CA_REQUEST_COMPRESSED: z.enum(['0', '1']).default('1'),

  /** File list selection strategy for XML channel. */
  NORDEA_CA_FILE_STATUS: z.enum(['NEW', 'DLD', 'ALL']).default('NEW'),
  NORDEA_CA_LOOKBACK_DAYS: z.coerce.number().int().min(1).max(31).default(7),
  NORDEA_CA_MAX_FILES_PER_RUN: z.coerce.number().int().min(1).max(100).default(25),
})

export type NordeaCorporateAccessEnvConfig = z.infer<typeof schema>

export function loadNordeaCorporateAccessEnvConfig(
  env: NodeJS.ProcessEnv = process.env,
): NordeaCorporateAccessEnvConfig {
  return schema.parse(env)
}
