import "./app/lib/env/env"
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const requireFromConfig = createRequire(import.meta.url)

// pnpm hoists h3 v2 (pulled in by devtools) to the root, so bare "h3" imports would resolve to
// another instance than the h3 v1 Nitro actually runs on.
const nitroH3Dir = dirname(requireFromConfig.resolve('h3/package.json', {
  paths: [dirname(requireFromConfig.resolve('nitropack/package.json'))],
}))
const nitroH3Entry = join(nitroH3Dir, 'dist/index.mjs')

function resolveAppOrigin(): string | undefined {
  const explicitOrigin = process.env.OIDC_APP_ORIGIN?.trim()
  if (explicitOrigin) {
    return explicitOrigin.replace(/\/+$/, '')
  }

  const codespaceName = process.env.CODESPACE_NAME?.trim()
  const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN?.trim()

  if (codespaceName && forwardingDomain) {
    return `https://${codespaceName}-3000.${forwardingDomain}`
  }

  return undefined
}

const appOrigin = resolveAppOrigin()
const isCodespaces = Boolean(process.env.CODESPACE_NAME?.trim())
const devtoolsEnv = process.env.NUXT_DEVTOOLS?.trim().toLowerCase()
const enableNuxtDevtools = devtoolsEnv === 'true' && !isCodespaces

export default defineNuxtConfig({
  alias: {
    '#engine': fileURLToPath(new URL('./engine', import.meta.url)),
    h3: nitroH3Entry,
  },

  vite: {
    optimizeDeps: {
      include: [
        '@internationalized/date',
        '@tanstack/table-core',
        '@tanstack/match-sorter-utils',
        'drizzle-orm/pg-core',
        'drizzle-zod',
        'zod',
      ]
    },
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '0 3 * * *': 'bank-transactions-batch',
      '30 3 * * *': 'db-cleanup-batch',
    },
  },

  modules: ['@nuxt/ui', '@nuxt/eslint', '@vueuse/nuxt', [
    '@vee-validate/nuxt',
    {
      autoImports: true,        
    },
  ], 'nuxt-oidc-auth'],

  oidc: {
    defaultProvider: 'keycloak',
    provideDefaultSecrets: true,
    devMode: {
      enabled: process.env.OIDC_DEV_MODE === 'true',
      generateAccessToken: true,
    },
    providers: {
      keycloak: {
        exposeAccessToken: true,
        baseUrl: process.env.KEYCLOAK_PUBLIC_URL ?? process.env.KEYCLOAK_AUTH_URL ?? process.env.KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        ...(appOrigin
          ? {
              redirectUri: `${appOrigin}/auth/keycloak/callback`,
              logoutRedirectUri: appOrigin,
              allowedCallbackRedirectUrls: [appOrigin],
            }
          : {}),
      }
    },
    middleware: {
      globalMiddlewareEnabled: true,
      customLoginPage: false
    }
  },

  runtimeConfig: {
    public: {
      oidcClientId: process.env.KEYCLOAK_CLIENT_ID,
      oidcDevMode: process.env.OIDC_DEV_MODE === 'true',
      devAuthBypass: process.env.DEV_AUTH_BYPASS === 'true',
      appOrigin,
    },
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: enableNuxtDevtools,

    timeline: {
      enabled: enableNuxtDevtools
    }
  },
})