import db from '~/lib/db'
import { eq } from 'drizzle-orm'
import { notificationSettings } from '~/lib/db/schema/notificationSettings'
import { submitMailNotificationViaOutbox } from '../infrastructure/notificationOutbox'
import { getCertificateStatusFromPem } from '../../banking-ingestion/infrastructure/certificateStatus'
import { loadDanskeBankEnvSecrets } from '../../banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'
import { loadNordeaEnvSecrets } from '../../banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'

function isAlertStatus(s: any): s is { status: 'expires_soon' | 'expired'; expiresAt: string; daysRemaining: number; fingerprintSha256Hex?: string } {
  return s?.status === 'expires_soon' || s?.status === 'expired'
}

export async function sendCertificateExpiryAlertsForRun(input: { runId: string }): Promise<{ sent: number }> {
  const [row] = await db
    .select({ adminEmail: notificationSettings.adminEmail })
    .from(notificationSettings)
    .where(eq(notificationSettings.id, 'default'))
    .limit(1)

  const to = (row?.adminEmail ?? '').trim()
  if (!to) return { sent: 0 }

  const alerts: Array<{ providerLabel: string; status: any; rotateHint: string }> = []

  try {
    const danske = loadDanskeBankEnvSecrets()
    const status = getCertificateStatusFromPem({ certificatePem: danske.applicationRequestCertificatePem, expiresSoonDays: 7 })
    if (isAlertStatus(status)) {
      alerts.push({
        providerLabel: 'Danske Bank',
        status,
        rotateHint:
          'Opdatér secrets: DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64 + DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64',
      })
    }
  } catch {
    // ignore if not configured
  }

  try {
    const nordea = loadNordeaEnvSecrets()
    const status = getCertificateStatusFromPem({ certificatePem: nordea.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM, expiresSoonDays: 7 })
    if (isAlertStatus(status)) {
      alerts.push({
        providerLabel: 'Nordea',
        status,
        rotateHint:
          'Opdatér secrets: NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64 + NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64',
      })
    }
  } catch {
    // ignore if not configured
  }

  if (!alerts.length) return { sent: 0 }

  const subject = `[Bankintegration] Certifikatstatus: handling påkrævet (${alerts.map(a => a.providerLabel).join(', ')})`

  const bodyLines: string[] = []
  bodyLines.push('Mindelse: Et eller flere bank-certifikater udløber snart eller er udløbet.')
  bodyLines.push('')

  for (const a of alerts) {
    bodyLines.push(`- ${a.providerLabel}: ${a.status.status} (udløber ${a.status.expiresAt} | ${a.status.daysRemaining} dage tilbage)`) 
    if (a.status.fingerprintSha256Hex) {
      bodyLines.push(`  Fingerprint (sha256): ${a.status.fingerprintSha256Hex}`)
    }
    bodyLines.push(`  ${a.rotateHint}`)
    bodyLines.push('')
  }

  bodyLines.push('Hvis du skal oprette nye Danske certifikater:')
  bodyLines.push('  pnpm tsx scripts/banking/danske/pkiws-create-customer-certs.ts --help')
  bodyLines.push('')
  bodyLines.push('OBS: certifikater/private keys skal roteres via jeres normale secret-proces (ikke via UI).')

  let sent = 0
  for (const a of alerts) {
    const fp = a.status.fingerprintSha256Hex ?? 'unknown'
    const exp = String(a.status.expiresAt).slice(0, 10)
    const dedupeKey = `notifications.cert-expiry:${a.providerLabel}:${fp}:${exp}:${to}`

    await submitMailNotificationViaOutbox({
      runId: input.runId,
      dedupeKey,
      notification: {
        to,
        subject,
        body: bodyLines.join('\n'),
      },
    })
    sent++
  }

  return { sent }
}
