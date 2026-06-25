import "./app/lib/env/env"
import { fileURLToPath } from 'node:url'

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
const enableNuxtDevtools = devtoolsEnv === 'true' || (devtoolsEnv !== 'false' && !isCodespaces)

export default defineNuxtConfig({
  alias: {
    '#engine': fileURLToPath(new URL('./engine', import.meta.url)),
  },

  vite: {
    optimizeDeps: {
      include: [
        '@internationalized/date',
        '@tanstack/table-core',
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