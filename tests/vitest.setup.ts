// Ensure strict env parsing doesn't block tests.
// The app validates required variables at import time (app/lib/env/env.ts).

function setIfMissing(key: string, value: string) {
  if (!process.env[key]) process.env[key] = value
}

setIfMissing('POSTGRES_USER', 'root')
setIfMissing('POSTGRES_PASSWORD', 'pass')
setIfMissing('POSTGRES_DB', 'mydb')

// For integration tests, this must point to a reachable Postgres.
// Locally you can run `docker compose up -d db` and use localhost.
setIfMissing('DATABASE_URL', 'postgres://root:pass@localhost:5432/mydb')

setIfMissing('ERP_SUPPLIER', 'kmd')
setIfMissing('ERP_ERROR_ACCOUNT', '95999999')
setIfMissing('ERP_ACTIVE_INTEGRATION', 'false')
setIfMissing('ERP_PROD_ENVIRONMENT', 'P04')
setIfMissing('ERP_MUNICIPALITY_CODE', '730')
setIfMissing('ERP_COMP_CODE', '0020')
setIfMissing('ERP_INTEGRATION_ID', 'TEST')
setIfMissing('ERP_INTEGRATION_FILENAME_MASK', 'ZFIR_KMD_Opus_Posteringer_IND_{municipalityCode}_{integrationId}_{docDate}_{docTime}.xml')

setIfMissing('SFTP_URL', 'sftp://example.invalid')
setIfMissing('SFTP_USERNAME', 'dummy')
setIfMissing('SFTP_PASSWORD', 'dummy')
setIfMissing('SFTP_REQUEST_DIR', '/til-kmd/')
setIfMissing('SFTP_RESPONSE_DIR', '/fra-kmd/')
