import { logger } from '../../../app/lib/logger'

export type MailMessage = {
  to: string
  subject: string
  body: string
}

export type SmtpConfig = {
  host: string
  allowedRecipientDomain: string
  port: number
  senderAddress: string
}

function assertValidRecipientDomain(to: string, allowedDomain: string) {
  const trimmed = to.trim()
  const at = trimmed.lastIndexOf('@')
  if (at < 0) {
    throw new Error('Ugyldig modtager-email (mangler @)')
  }

  const recipientDomain = trimmed.slice(at + 1).toLowerCase()
  if (recipientDomain !== allowedDomain.toLowerCase()) {
    throw new Error(`Modtager-email skal være inden for domænet ${allowedDomain}`)
  }
}

function escapeDotStuffing(line: string): string {
  return line.startsWith('.') ? `.${line}` : line
}

function toCrlf(input: string): string {
  return input.replace(/\r?\n/g, '\r\n')
}

export async function sendSmtpMail(
  config: SmtpConfig,
  mail: MailMessage,
): Promise<void> {
  assertValidRecipientDomain(mail.to, config.allowedRecipientDomain)

  const log = logger.child({ scope: 'smtp.send', smtpHost: config.host, smtpPort: config.port })

  const net = await import('node:net')

  const socket = net.createConnection({ host: config.host, port: config.port })

  const readLine = () => new Promise<string>((resolve, reject) => {
    let buffer = ''

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      // SMTP can send multi-line responses. We consider we have a complete response
      // when we see a line that starts with a 3-digit code followed by a space.
      const lines = buffer.split(/\r\n/)
      // Keep last partial line in buffer
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (/^\d{3} /.test(line)) {
          cleanup()
          resolve(line)
          return
        }
      }
    }

    const onError = (err: any) => {
      cleanup()
      reject(err)
    }

    const onClose = () => {
      cleanup()
      reject(new Error('SMTP connection closed'))
    }

    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
      socket.off('close', onClose)
    }

    socket.on('data', onData)
    socket.on('error', onError)
    socket.on('close', onClose)
  })

  const sendCmd = (cmd: string) => {
    socket.write(`${cmd}\r\n`)
  }

  const expect = async (prefix: string) => {
    const line = await readLine()
    if (!line.startsWith(prefix)) {
      throw new Error(`SMTP forventede ${prefix}*, fik: ${line}`)
    }
  }

  try {
    log.info('smtp.connect')
    await expect('220')

    sendCmd('EHLO localhost')
    // EHLO typically returns multiline 250- + final 250.
    // Our readLine waits for the final 250 line with a space.
    await expect('250')

    sendCmd(`MAIL FROM:<${config.senderAddress}>`)
    await expect('250')

    sendCmd(`RCPT TO:<${mail.to.trim()}>`)
    await expect('250')

    sendCmd('DATA')
    await expect('354')

    const headers = [
      `From: ${config.senderAddress}`,
      `To: ${mail.to.trim()}`,
      `Subject: ${mail.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
    ].join('\r\n')

    const bodyLines = toCrlf(mail.body).split('\r\n').map(escapeDotStuffing).join('\r\n')
    const data = `${headers}${bodyLines}\r\n.\r\n`
    socket.write(data)

    await expect('250')

    sendCmd('QUIT')
    await expect('221')

    log.info('smtp.sent')
  } finally {
    socket.end()
  }
}
