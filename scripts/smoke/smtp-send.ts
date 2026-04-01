import { z } from 'zod'
import { sendSmtpMail } from '../../engine/notifications/infrastructure/smtpClient'

const ArgsSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).default('SMTP smoke test'),
  body: z.string().min(1).default('This is a smoke test.'),
})

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {}
  for (const raw of argv) {
    const m = raw.match(/^--([^=]+)=(.*)$/)
    if (!m) continue
    args[m[1]] = m[2]
  }

  return ArgsSchema.parse({
    to: args.to,
    subject: args.subject,
    body: args.body,
  })
}

const EnvSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(25),
  SMTP_ALLOWED_RECIPIENT_DOMAIN: z.string().min(1),
  AUTH_SENDER_ADDRESS: z.string().email(),
})

async function main() {
  const { to, subject, body } = parseArgs(process.argv.slice(2))
  const env = EnvSchema.parse(process.env)

  await sendSmtpMail(
    {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      allowedRecipientDomain: env.SMTP_ALLOWED_RECIPIENT_DOMAIN,
      senderAddress: env.AUTH_SENDER_ADDRESS,
    },
    { to, subject, body },
  )

  // eslint-disable-next-line no-console
  console.log(`OK: sent to ${to} via ${env.SMTP_HOST}:${env.SMTP_PORT}`)
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
