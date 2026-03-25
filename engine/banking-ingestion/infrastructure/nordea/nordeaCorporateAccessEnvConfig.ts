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
    .optional()
    .default('https://ws.ebridge.prod.nordea.com/ws/CorporateFileService'),

  /** SOAP RequestHeader fields (agreement-managed). */
  NORDEA_CA_WS_SENDER_ID: z.string().min(1),
  NORDEA_CA_WS_RECEIVER_ID: z.string().min(1).optional().default('Nordea'),
  NORDEA_CA_WS_USER_AGENT: z.string().min(1),
  NORDEA_CA_WS_LANGUAGE: z.enum(['EN', 'SV', 'FI']).optional().default('EN'),

  /** Secure Envelope (ApplicationRequest) fields. */
  NORDEA_CA_CUSTOMER_ID: z.string().min(1).max(16),
  NORDEA_CA_SIGNER_ID: z.string().min(1).max(80),
  NORDEA_CA_SOFTWARE_ID: z.string().min(1).max(80),
  NORDEA_CA_ENVIRONMENT: z.enum(['PRODUCTION', 'TEST']).optional().default('TEST'),

  /** Prefer extended CAMT.053 as per Nordea Secure Envelope Appendix B. */
  NORDEA_CA_STATEMENT_FILE_TYPE: z.string().min(1).optional().default('NDAREXXMLO'),

  /** Optional: request compressed payload in DownloadFile (recommended). */
  NORDEA_CA_REQUEST_COMPRESSED: z.enum(['0', '1']).optional().default('1'),
})

export type NordeaCorporateAccessEnvConfig = z.infer<typeof schema>

export function loadNordeaCorporateAccessEnvConfig(
  env: NodeJS.ProcessEnv = process.env,
): NordeaCorporateAccessEnvConfig {
  return schema.parse(env)
}
