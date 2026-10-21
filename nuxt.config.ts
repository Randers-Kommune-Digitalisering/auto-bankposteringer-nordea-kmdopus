import "./app/lib/env/env"
import { createRequire } from 'node:module'
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const requireFromConfig = createRequire(import.meta.url)

// pnpm hoists h3 v2 (pulled in by devtools) to the root, so bare "h3" imports would resolve to
// another instance than the h3 v1 Nitro actually runs on.
const nitroH3Dir = dirname(requireFromConfig.resolve('h3/package.json', {
  paths: [dirname(requireFromConfig.resolve('nitropack/package.json'))],
}))
const nitroH3Entry = join(nitroH3Dir, 'dist/index.mjs')

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
        'zod/v4'
      ]
    },
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    hooks: {
      compiled: async (nitro) => {
        const wasmPath = join(nitro.options.output.serverDir, 'node_modules/re2-wasm/build/wasm/re2.wasm')
        await mkdir(dirname(wasmPath), { recursive: true })
        await copyFile(requireFromConfig.resolve('re2-wasm/build/wasm/re2.wasm'), wasmPath)
      },
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
    provideDefaultSecrets: false,
    devMode: {
      enabled: process.env.OIDC_DEV_MODE === 'true',
      generateAccessToken: true,
    },
    providers: {
      keycloak: {
        exposeAccessToken: true,
      }
    },
    middleware: {
      globalMiddlewareEnabled: true,
      customLoginPage: false
    }
  },

  runtimeConfig: {
    oidc: {
      providers: {
        keycloak: {
          clientId: '',
          clientSecret: '',
          baseUrl: '',
          authorizationUrl: '',
          tokenUrl: '',
          userInfoUrl: '',
          logoutUrl: '',
          redirectUri: '',
          logoutRedirectUri: '',
        },
      },
    },
    public: {
      oidcClientId: '',
      oidcDevMode: process.env.OIDC_DEV_MODE === 'true',
      devAuthBypass: process.env.DEV_AUTH_BYPASS === 'true',
      appOrigin: '',
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