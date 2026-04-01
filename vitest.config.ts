import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/vitest.setup.ts'],
    include: ['**/*.test.ts'],
  },
})
