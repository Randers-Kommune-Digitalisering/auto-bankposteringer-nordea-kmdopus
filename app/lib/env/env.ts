// Checks whether all required environment variables are set before starting the application
import { z } from "zod";
import tryParseEnv from "./try-parse-env";
import { erpSupplierValues } from "../db/schema/enums";

const baseCommonSchema = z.object({
  APP_ROLE: z.enum(["web", "scheduler", "worker"]).optional().default("web"),
  // These are primarily for docker-compose / local dev.
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  DATABASE_URL: z.string(),

  ERP_SUPPLIER: z.enum(erpSupplierValues),
  ERP_ERROR_ACCOUNT: z.string(),
  ERP_ACTIVE_INTEGRATION: z.enum(["true", "false"]).transform((value) => value === "true"),
  ERP_PROD_ENVIRONMENT: z.string(),
  ERP_MUNICIPALITY_CODE: z.string(),
  ERP_COMP_CODE: z.string(),
  ERP_INTEGRATION_ID: z.string(),
  ERP_INTEGRATION_FILENAME_MASK: z.string(),

  // Keycloak / OpenID Connect (for access control)
  KEYCLOAK_URL: z.string().optional(),
  KEYCLOAK_REALM: z.string().optional().default('randers-kommune'),
  KEYCLOAK_CLIENT_ID: z.string().optional(),
  KEYCLOAK_CLIENT_SECRET: z.string().optional(),
  // Legacy alias for app client id.
  KEYCLOAK_APP_CLIENT_ID: z.string().optional(),
  KEYCLOAK_APP_CLIENT_SECRET: z.string().optional(),
  // Legacy aliases used by existing Flask/Python setup.
  KEYCLOAK_USER_ADMIN_CLIENT_ID: z.string().optional(),
  KEYCLOAK_USER_ADMIN_CLIENT_SECRET: z.string().optional(),
  // Optional scope for token requests, when required by the IdP policy.
  KEYCLOAK_ADMIN_CLIENT_SCOPE: z.string().optional(),
  // Client where roles are managed (defaults to KEYCLOAK_CLIENT_ID if unset).
  KEYCLOAK_ADMIN_TARGET_CLIENT_ID: z.string().optional(),
  // Optional: expected audience override. Defaults to KEYCLOAK_CLIENT_ID.
  KEYCLOAK_AUDIENCE: z.string().optional(),
  // Optional: cookie name for access token if provided by an upstream auth proxy.
  KEYCLOAK_ACCESS_TOKEN_COOKIE: z.string().optional(),
  
  // nuxt-oidc-auth session/key material.
  NUXT_OIDC_SESSION_SECRET: z.string().optional(),
  NUXT_OIDC_AUTH_SESSION_SECRET: z.string().optional(),
  NUXT_OIDC_TOKEN_KEY: z.string().optional(),

  // oauth2-proxy / openid proxy integration (xauthrequest headers)
  // If set, groups from X-Auth-Request-Groups can be mapped to app roles.
  OIDC_ALLOWED_GROUP_PREFIX: z.string().optional(),
  // Optional comma-separated allowlist for API CORS (supports credentials).
  OIDC_CORS_ALLOWED_ORIGINS: z.string().optional(),

  // Dev convenience: bypass auth entirely in local dev.
  // Keep stateless: this only changes runtime behavior based on env.
  DEV_AUTH_BYPASS: z.enum(['true', 'false']).optional().default('false').transform(v => v === 'true'),

  // Controls whether members of deterministic grouped open items can be processed individually in UI.
  OPEN_ITEMS_ALLOW_GROUP_MEMBER_PROCESSING: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform(v => v === 'true'),

  // Retention policy for deleting sensitive/history tables.
  // Default is 90 days if unset.
  DATA_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(90),

  // SFTP is required only for roles that actually communicate with the ERP via SFTP.
  SFTP_URL: z.string().optional(),
  SFTP_USERNAME: z.string().optional(),
  SFTP_PASSWORD: z.string().optional(),
  SFTP_REQUEST_DIR: z.string().optional(),
  SFTP_RESPONSE_DIR: z.string().optional(),
});

function withNormalizedEnv(raw: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const out = { ...raw }

  out.KEYCLOAK_AUTH_URL = out.KEYCLOAK_AUTH_URL ?? out.KEYCLOAK_URL
  out.KEYCLOAK_CLIENT_ID = out.KEYCLOAK_CLIENT_ID ?? out.KEYCLOAK_APP_CLIENT_ID
  out.KEYCLOAK_CLIENT_SECRET = out.KEYCLOAK_CLIENT_SECRET ?? out.KEYCLOAK_APP_CLIENT_SECRET
  out.KEYCLOAK_ADMIN_CLIENT_ID = out.KEYCLOAK_ADMIN_CLIENT_ID ?? out.KEYCLOAK_USER_ADMIN_CLIENT_ID
  out.KEYCLOAK_ADMIN_CLIENT_SECRET = out.KEYCLOAK_ADMIN_CLIENT_SECRET ?? out.KEYCLOAK_USER_ADMIN_CLIENT_SECRET

  return out
}

const webSchema = baseCommonSchema.extend({
  APP_ROLE: z.literal("web"),
});

const workerSchema = baseCommonSchema.extend({
  APP_ROLE: z.literal("worker"),
  SFTP_URL: z.string(),
  SFTP_USERNAME: z.string(),
  SFTP_PASSWORD: z.string(),
  SFTP_REQUEST_DIR: z.string(),
  SFTP_RESPONSE_DIR: z.string(),
});

const schedulerSchema = baseCommonSchema.extend({
  APP_ROLE: z.literal("scheduler"),
});

const EnvSchema = z.union([webSchema, workerSchema, schedulerSchema]);

export type EnvSchema = z.infer<typeof EnvSchema>;

const normalizedEnv = withNormalizedEnv({ ...process.env, APP_ROLE: process.env.APP_ROLE ?? "web" })
tryParseEnv(EnvSchema, normalizedEnv);
const parsedEnv = EnvSchema.parse(normalizedEnv);

export const erpIntegrationMetadata = {
  erpSupplier: parsedEnv.ERP_SUPPLIER,
  erpErrorAccount: parsedEnv.ERP_ERROR_ACCOUNT,
  activeIntegration: parsedEnv.ERP_ACTIVE_INTEGRATION,
  prodEnvironment: parsedEnv.ERP_PROD_ENVIRONMENT,
  municipalityCode: parsedEnv.ERP_MUNICIPALITY_CODE,
  compCode: parsedEnv.ERP_COMP_CODE,
  integrationId: parsedEnv.ERP_INTEGRATION_ID,
  integrationFileNameMask: parsedEnv.ERP_INTEGRATION_FILENAME_MASK,
};

export type ErpIntegrationMetadata = typeof erpIntegrationMetadata;

export default parsedEnv;