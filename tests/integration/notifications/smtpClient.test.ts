import net from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { sendSmtpMail } from '../../../engine/notifications/infrastructure/smtpClient'

type ReceivedMail = {
  mailFrom?: string
  rcptTo?: string
  data?: string
}

type SmtpServerHandle = {
  host: string
  port: number
  received: ReceivedMail
  close: () => Promise<void>
}

function once<T>(emitter: NodeJS.EventEmitter, event: string) {
  return new Promise<T>((resolve, reject) => {
    const onEvent = (value: any) => {
      cleanup()
      resolve(value)
    }
    const onError = (err: any) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      emitter.off(event, onEvent)
      emitter.off('error', onError)
    }

    emitter.on(event, onEvent)
    emitter.on('error', onError)
  })
}

async function startFakeSmtpServer(): Promise<SmtpServerHandle> {
  const received: ReceivedMail = {}

  const server = net.createServer(socket => {
    socket.setEncoding('utf8')

    const write = (line: string) => socket.write(`${line}\r\n`)

    // Greeting
    write('220 fake-smtp ESMTP ready')

    let mode: 'command' | 'data' = 'command'
    let dataBuffer = ''

    const handleCommand = (line: string) => {
      const trimmed = line.replace(/\r?\n$/, '')
      const upper = trimmed.toUpperCase()

      if (upper.startsWith('EHLO')) {
        // Multiline response: 250- + final 250 <space>
        socket.write('250-fake-smtp\r\n')
        socket.write('250 PIPELINING\r\n')
        return
      }

      if (upper.startsWith('MAIL FROM:')) {
        received.mailFrom = trimmed
        write('250 OK')
        return
      }

      if (upper.startsWith('RCPT TO:')) {
        received.rcptTo = trimmed
        write('250 OK')
        return
      }

      if (upper === 'DATA') {
        mode = 'data'
        write('354 End data with <CR><LF>.<CR><LF>')
        return
      }

      if (upper === 'QUIT') {
        write('221 Bye')
        socket.end()
        return
      }

      write('250 OK')
    }

    const handleData = (chunk: string) => {
      dataBuffer += chunk

      const terminator = '\r\n.\r\n'
      const idx = dataBuffer.indexOf(terminator)
      if (idx < 0) return

      received.data = dataBuffer.slice(0, idx)
      dataBuffer = dataBuffer.slice(idx + terminator.length)
      mode = 'command'
      write('250 Queued')
    }

    socket.on('data', (chunk: string) => {
      if (mode === 'data') {
        handleData(chunk)
        return
      }

      // Commands are line-based; buffer and split on CRLF.
      const lines = chunk.split(/\r\n/)
      for (const line of lines) {
        if (!line) continue
        handleCommand(line)
      }
    })
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  const addr = server.address()
  if (addr == null || typeof addr === 'string') {
    throw new Error('Could not determine fake SMTP server address')
  }

  return {
    host: addr.address,
    port: addr.port,
    received,
    close: async () => {
      server.close()
      await once(server, 'close')
    },
  }
}

describe('smtpClient', () => {
  let handle: SmtpServerHandle | null = null

  afterEach(async () => {
    if (handle) await handle.close()
    handle = null
  })

  it('sends SMTP commands and dot-stuffs body lines', async () => {
    handle = await startFakeSmtpServer()

    await sendSmtpMail(
      {
        host: handle.host,
        port: handle.port,
        senderAddress: 'sender@example.com',
        allowedRecipientDomain: 'example.com',
      },
      {
        to: 'test@example.com',
        subject: 'Hello',
        body: 'Line1\n.LeadingDot\nLine3',
      },
    )

    expect(handle.received.mailFrom).toContain('MAIL FROM:<sender@example.com>')
    expect(handle.received.rcptTo).toContain('RCPT TO:<test@example.com>')

    expect(handle.received.data).toBeTruthy()
    const data = handle.received.data ?? ''

    // Headers should use CRLF and contain required fields.
    expect(data).toContain('From: sender@example.com\r\n')
    expect(data).toContain('To: test@example.com\r\n')
    expect(data).toContain('Subject: Hello\r\n')

    // Dot-stuffing: lines starting with '.' are prefixed with an extra '.'
    expect(data).toContain('\r\n..LeadingDot\r\n')
  })

  it('rejects recipients outside allowed domain', async () => {
    handle = await startFakeSmtpServer()

    await expect(
      sendSmtpMail(
        {
          host: handle.host,
          port: handle.port,
          senderAddress: 'sender@example.com',
          allowedRecipientDomain: 'example.com',
        },
        {
          to: 'test@other.com',
          subject: 'Hello',
          body: 'Body',
        },
      ),
    ).rejects.toThrow(/domænet/i)
  })
})
