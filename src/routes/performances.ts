import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import db from '../db.js'
import { PerformanceStatus } from '../generated/prisma/index.js'

const performances = new Hono()

const validationSchemas = {
  create: z.object({
    date: z.iso.datetime(),
    status: z.enum(PerformanceStatus).optional(),
    notes: z.string().optional(),
    venueId: z.string(),
    performerIds: z.array(z.string()).min(1),
    conductorId: z.string().optional(),
  }),
  update: z.object({
    date: z.iso.datetime().optional(),
    status: z.enum(PerformanceStatus).optional(),
    notes: z.string().optional(),
    venueId: z.string().optional(),
    performerIds: z.array(z.string()).min(1).optional(),
    conductorId: z.string().nullable().optional(),
  }),
}

const relationsToInclude = {
  venue: true,
  performers: true,
  conductor: true,
  setList: {
    include: {
      work: {
        include: { composers: true }
      },
      conductor: true,
      featuredPerformers: {
        include: { performer: true }
      }
    }
  }
}

performances.get('/', async (c) => {
  const all = await db.performance.findMany({
    include: relationsToInclude
  })
  return c.json(all)
})

performances.get('/:id', async (c) => {
  const performance = await db.performance.findUnique({
    where: { id: c.req.param('id') },
    include: relationsToInclude
  })

  if (!performance) {
    return c.json({ error: 'Performance not found' }, 404)
  }

  return c.json(performance)
})

performances.post('/', zValidator('json', validationSchemas.create), async (c) => {
  const body = c.req.valid('json')

  const performance = await db.performance.create({
    data: {
      date: new Date(body.date),
      status: body.status,
      notes: body.notes,
      venue: { connect: { id: body.venueId } },
      performers: {
        connect: body.performerIds.map((id) => ({ id }))
      },
      conductor: body.conductorId
        ? { connect: { id: body.conductorId } }
        : undefined,
    },
    include: relationsToInclude
  })

  return c.json(performance, 201)
})

performances.put('/:id', zValidator('json', validationSchemas.update), async (c) => {
  const body = c.req.valid('json')

  const performance = await db.performance.update({
    where: { id: c.req.param('id') },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      status: body.status,
      notes: body.notes,
      venue: body.venueId
        ? { connect: { id: body.venueId } }
        : undefined,
      performers: body.performerIds
        ? { set: body.performerIds.map((id) => ({ id })) }
        : undefined,
      conductor: body.conductorId
        ? { connect: { id: body.conductorId } }
        : body.conductorId === null
          ? { disconnect: true }
          : undefined,
    },
    include: relationsToInclude
  })

  return c.json(performance)
})

performances.delete('/:id', async (c) => {
  await db.performance.delete({
    where: { id: c.req.param('id') }
  })

  return c.body(null, 204)
})

export default performances
