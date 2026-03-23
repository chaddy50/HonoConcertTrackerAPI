import { GenericContainer, Wait } from 'testcontainers'
import { execSync } from 'child_process'
import type { ProvidedContext } from 'vitest'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

export async function setup({ provide }: { provide: <T extends keyof ProvidedContext>(key: T, value: ProvidedContext[T]) => void }) {
  process.env.TESTCONTAINERS_RYUK_DISABLED = 'true'

  const container = await new GenericContainer('postgres:17')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forListeningPorts())
    .start()

  const host = container.getHost()
  const port = container.getMappedPort(5432)
  const databaseUrl = `postgresql://test:test@${host}:${port}/test`

  // Run migrations against the test database
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  })

  provide('databaseUrl', databaseUrl)

  return async () => {
    await container.stop()
  }
}
