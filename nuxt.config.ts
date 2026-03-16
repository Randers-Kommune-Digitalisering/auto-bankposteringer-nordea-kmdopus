import "./app/lib/env"
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  alias: {
    '#engine': fileURLToPath(new URL('./engine', import.meta.url)),
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '0 3 * * *': 'bank-transactions-batch',
    },
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    [
      '@vee-validate/nuxt',
      {
        autoImports: true,        
      },
    ],
  ],

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})