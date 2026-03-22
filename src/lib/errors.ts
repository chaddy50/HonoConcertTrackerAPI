import { type Context } from 'hono'
import { Prisma } from '../generated/prisma/index.js'

export function handleError(err: unknown, c: Context) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // Not found
      case 'P2001':
      case 'P2015':
      case 'P2025':
        return c.json({ error: 'Record not found' }, 404)

      // Client errors — bad input
      case 'P2011':
        return c.json({ error: 'A required field was null' }, 400)
      case 'P2014':
        return c.json({ error: 'Operation would violate a required relation' }, 400)

      // Conflict
      case 'P2002':
        return c.json({ error: 'A record with that value already exists' }, 409)
      case 'P2003':
        return c.json({ error: 'Referenced record does not exist' }, 400)
      case 'P2034':
        return c.json({ error: 'Transaction conflict, please retry' }, 409)

      // Infra
      case 'P2024':
        return c.json({ error: 'Database unavailable, please try again later' }, 503)
    }
  }

  // Prisma validation errors mean the query itself was malformed
  if (err instanceof Prisma.PrismaClientValidationError) {
    return c.json({ error: 'Invalid request data' }, 400)
  }

  // Anything else is an unexpected server error
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
}
