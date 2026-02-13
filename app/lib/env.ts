// Checks whether all required environment variables are set before starting the application
import { z } from "zod";
import tryParseEnv from "./try-parse-env";

const EnvSchema = z.object({
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  DATABASE_URL: z.string(),
  BANKING_CLIENT_ID: z.string(),
  BANKING_CLIENT_SECRET: z.string(),
  BANKING_EIDASPRIVATEKEY: z.string(),
  BANKING_AGREEMENT_ID: z.string(),
  BANKING_SERVICE_PROVIDER: z.string(),
  BANKING_SERVICE_PROVIDER_ID: z.string(),
  BANKING_PASSCODE: z.string(),
  ERP_SUPPLIER: z.string(),
  ERP_ERROR_ACCOUNT: z.string(),
  ERP_ACTIVE_INTEGRATION: z.enum(["true", "false"]).transform((value) => value === "true"),
  ERP_PROD_ENVIRONMENT: z.string(),
  ERP_MUNICIPALITY_CODE: z.string(),
  ERP_COMP_CODE: z.string(),
  ERP_INTEGRATION_ID: z.string(),
  ERP_INTEGRATION_FILENAME_MASK: z.string(),
  ERP_PRIMARY_ACCOUNT_LABEL: z.string(),
  ERP_SECONDARY_ACCOUNT_LABEL: z.string(),
  ERP_TERTIARY_ACCOUNT_LABEL: z.string(),
  SFTP_URL: z.string(),
  SFTP_USERNAME: z.string(),
  SFTP_PASSWORD: z.string(),
  SFTP_SEND_DIR: z.string(),
  SFTP_RECEIVE_DIR: z.string(),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

tryParseEnv(EnvSchema);
const parsedEnv = EnvSchema.parse(process.env);

export const bankingIntegrationMetadata = {
  serviceProvider: parsedEnv.BANKING_SERVICE_PROVIDER,
  servicerProviderId: parsedEnv.BANKING_SERVICE_PROVIDER_ID,
  passcode: parsedEnv.BANKING_PASSCODE,
};

export const erpIntegrationMetadata = {
  erpSupplier: parsedEnv.ERP_SUPPLIER,
  erpErrorAccount: parsedEnv.ERP_ERROR_ACCOUNT,
  activeIntegration: parsedEnv.ERP_ACTIVE_INTEGRATION,
  prodEnvironment: parsedEnv.ERP_PROD_ENVIRONMENT,
  municipalityCode: parsedEnv.ERP_MUNICIPALITY_CODE,
  compCode: parsedEnv.ERP_COMP_CODE,
  integrationId: parsedEnv.ERP_INTEGRATION_ID,
  integrationFileNameMask: parsedEnv.ERP_INTEGRATION_FILENAME_MASK,
  primaryAccountLabel: parsedEnv.ERP_PRIMARY_ACCOUNT_LABEL,
  secondaryAccountLabel: parsedEnv.ERP_SECONDARY_ACCOUNT_LABEL,
  tertiaryAccountLabel: parsedEnv.ERP_TERTIARY_ACCOUNT_LABEL,
};

export type BankingIntegrationMetadata = typeof bankingIntegrationMetadata;
export type ErpIntegrationMetadata = typeof erpIntegrationMetadata;

export default parsedEnv;