import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './src/tests/setup/globalSetup.ts',
    setupFiles: ['./src/tests/setup/testSetup.ts'],
    include: ['src/tests/**/*.test.ts'],
    fileParallelism: false, // Vitest runs test files in parallel by default, which doesn't work when tests are sharing a database
    env: {
      TESTCONTAINERS_RYUK_DISABLED: 'true',
      NODE_ENV: 'test',
    },
  },
})
