// Checks whether all required environment variables are set before starting the application
import { z } from "zod";
import tryParseEnv from "./try-parse-env";
import { erpSupplierValues } from "../db/schema/enums";
import { IngestionEnvSchema } from "./env-ingestion";

const commonSchema = z.object({
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
  KEYCLOAK_AUTH_URL: z.string().optional(),
  KEYCLOAK_REALM: z.string().optional().default('randers-kommune'),
  KEYCLOAK_CLIENT_ID: z.string().optional(),
  // Optional: expected audience override. Defaults to KEYCLOAK_CLIENT_ID.
  KEYCLOAK_AUDIENCE: z.string().optional(),
  // Optional: cookie name for access token if provided by an upstream auth proxy.
  KEYCLOAK_ACCESS_TOKEN_COOKIE: z.string().optional(),

  // Dev convenience: bypass auth entirely in local dev.
  // Keep stateless: this only changes runtime behavior based on env.
  DEV_AUTH_BYPASS: z.enum(['true', 'false']).optional().default('false').transform(v => v === 'true'),

  // SFTP is required only for roles that actually communicate with the ERP via SFTP.
  SFTP_URL: z.string().optional(),
  SFTP_USERNAME: z.string().optional(),
  SFTP_PASSWORD: z.string().optional(),
  SFTP_REQUEST_DIR: z.string().optional(),
  SFTP_RESPONSE_DIR: z.string().optional(),
});

const webSchema = commonSchema.extend({
  APP_ROLE: z.literal("web"),
});

const workerSchema = commonSchema.extend({
  APP_ROLE: z.literal("worker"),
  SFTP_URL: z.string(),
  SFTP_USERNAME: z.string(),
  SFTP_PASSWORD: z.string(),
  SFTP_REQUEST_DIR: z.string(),
  SFTP_RESPONSE_DIR: z.string(),
});

const schedulerSchema = commonSchema.extend({
  APP_ROLE: z.literal("scheduler"),
});

const EnvSchema = z.union([webSchema, workerSchema, schedulerSchema]);

export type EnvSchema = z.infer<typeof EnvSchema>;

tryParseEnv(EnvSchema, { ...process.env, APP_ROLE: process.env.APP_ROLE ?? "web" });
// Only validates ingestion env when a provider is being configured.
tryParseEnv(IngestionEnvSchema);
const parsedEnv = EnvSchema.parse({ ...process.env, APP_ROLE: process.env.APP_ROLE ?? "web" });

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