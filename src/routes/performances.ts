import { Hono } from 'hono'
import db from '../db.js'

const performances = new Hono()

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

performances.post('/', async (c) => {
  const body = await c.req.json()

  const performance = await db.performance.create({
    data: {
      date: new Date(body.date),
      status: body.status,
      notes: body.notes,
      venue: { connect: { id: body.venueId } },
      performers: {
        connect: body.performerIds.map((id: string) => ({ id }))
      },
      conductor: body.conductorId
        ? { connect: { id: body.conductorId } }
        : undefined,
    },
    include: relationsToInclude
  })

  return c.json(performance, 201)
})

performances.put('/:id', async (c) => {
  const body = await c.req.json()

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
        ? { set: body.performerIds.map((id: string) => ({ id })) }
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
