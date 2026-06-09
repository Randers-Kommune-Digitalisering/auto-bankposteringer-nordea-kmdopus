import { defineVitestConfig } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

export default defineVitestConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    setupFiles: ['tests/vitest.setup.ts'],
    include: ['**/*.test.ts'],
    server: {
      deps: {
        fallbackCJS: true,
        inline: ['pg', 'pg-pool', 'drizzle-orm'],
      },
    },
    alias: [
      {
        find: /^pg$/,
        replacement: fileURLToPath(new URL('./tests/shims/pg.ts', import.meta.url)),
      },
    ],
  },
})
