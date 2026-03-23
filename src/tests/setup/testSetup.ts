import { inject } from 'vitest'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

// Set DATABASE_URL synchronously before any test module is imported.
// dotenv will not override this since it only sets vars that are not already set.
process.env.DATABASE_URL = inject('databaseUrl')
