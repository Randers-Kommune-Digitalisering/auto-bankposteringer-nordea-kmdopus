import "./app/lib/env/env"
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  alias: {
    '#engine': fileURLToPath(new URL('./engine', import.meta.url)),
  },

  vite: {
    optimizeDeps: {
      include: [
        '@internationalized/date',
        'zod',
      ]
    }
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
    devMode: {
      enabled: process.env.OIDC_DEV_MODE === 'true',
      userName: 'Nuxt OIDC Dev',
      userInfo: {
        preferred_username: 'dev',
        roles: ['dev'],
      },
    },
    providers: {
      keycloak: {
        baseUrl: process.env.KEYCLOAK_PUBLIC_URL ?? process.env.KEYCLOAK_AUTH_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      }
    }
  },

  runtimeConfig: {
    public: {
      oidcClientId: process.env.KEYCLOAK_CLIENT_ID,
    },
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})