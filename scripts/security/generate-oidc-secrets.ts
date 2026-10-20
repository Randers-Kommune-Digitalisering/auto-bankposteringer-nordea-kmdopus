import { randomBytes } from 'node:crypto'
import { chmod, mkdir, open } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export type OidcSecrets = {
  NUXT_OIDC_SESSION_SECRET: string
  NUXT_OIDC_TOKEN_KEY: string
  NUXT_OIDC_AUTH_SESSION_SECRET: string
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const secretDirectory = resolve(repositoryRoot, '.secrets/oidc')

export function generateOidcSecrets(): OidcSecrets {
  return {
    NUXT_OIDC_SESSION_SECRET: randomBytes(36).toString('base64url'),
    NUXT_OIDC_TOKEN_KEY: randomBytes(32).toString('base64'),
    NUXT_OIDC_AUTH_SESSION_SECRET: randomBytes(36).toString('base64url'),
  }
}

export function formatOidcSecrets(secrets: OidcSecrets): string {
  return [
    `NUXT_OIDC_SESSION_SECRET=${secrets.NUXT_OIDC_SESSION_SECRET}`,
    `NUXT_OIDC_TOKEN_KEY=${secrets.NUXT_OIDC_TOKEN_KEY}`,
    `NUXT_OIDC_AUTH_SESSION_SECRET=${secrets.NUXT_OIDC_AUTH_SESSION_SECRET}`,
    '',
  ].join('\n')
}

export async function writeOidcSecretsFile(outputFile: string, secrets: OidcSecrets): Promise<string> {
  const absolutePath = resolve(repositoryRoot, outputFile)
  const relativePath = relative(secretDirectory, absolutePath)

  if (
    !relativePath
    || relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
    || isAbsolute(relativePath)
    || dirname(absolutePath) !== secretDirectory
  ) {
    throw new Error('Output file must be directly inside .secrets/oidc/')
  }

  await mkdir(secretDirectory, { recursive: true, mode: 0o700 })
  await chmod(secretDirectory, 0o700)

  const file = await open(absolutePath, 'wx', 0o600)
  try {
    await file.writeFile(formatOidcSecrets(secrets), 'utf8')
    await chmod(absolutePath, 0o600)
  } catch (error) {
    const { unlink } = await import('node:fs/promises')
    await unlink(absolutePath).catch(() => undefined)
    throw error
  } finally {
    await file.close()
  }

  return absolutePath
}

function parseArguments(argv: string[]): { help: boolean; outputFile?: string } {
  let help = false
  let outputFile: string | undefined
  const argumentsAfterPnpmSeparator = argv[0] === '--' ? argv.slice(1) : argv

  for (let index = 0; index < argumentsAfterPnpmSeparator.length; index += 1) {
    const argument = argumentsAfterPnpmSeparator[index]!
    if (argument === '--help' || argument === '-h') {
      help = true
      continue
    }

    if (argument === '--output-file') {
      const value = argumentsAfterPnpmSeparator[index + 1]
      if (!value || value.startsWith('--')) throw new Error('--output-file requires a path')
      if (outputFile) throw new Error('--output-file may only be supplied once')
      outputFile = value
      index += 1
      continue
    }

    if (argument.startsWith('--output-file=')) {
      if (outputFile) throw new Error('--output-file may only be supplied once')
      outputFile = argument.slice('--output-file='.length)
      if (!outputFile) throw new Error('--output-file requires a path')
      continue
    }

    throw new Error(`Unknown option: ${argument}`)
  }

  return { help, outputFile }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    console.log('Usage: pnpm auth:oidc:generate-secrets [--output-file .secrets/oidc/<name>.env]')
    console.log('Prints the three OIDC secrets to an interactive terminal unless --output-file is supplied.')
    return
  }

  if (process.env.CI === 'true') {
    throw new Error('Refusing to generate OIDC secrets in CI')
  }

  if (!options.outputFile && !process.stdout.isTTY) {
    throw new Error('Refusing to print secrets to a non-interactive stream; use --output-file explicitly')
  }

  const secrets = generateOidcSecrets()
  if (options.outputFile) {
    const path = await writeOidcSecretsFile(options.outputFile, secrets)
    console.error(`Wrote OIDC secrets to ${path}`)
    return
  }

  process.stdout.write(formatOidcSecrets(secrets))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`OIDC secret generation failed: ${message}`)
    process.exitCode = 1
  })
}