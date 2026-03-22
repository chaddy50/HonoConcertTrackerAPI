import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import db from '../db.js'
import { PerformerType } from '../generated/prisma/index.js'

const performers = new Hono()

const validationSchemas = {
  create: z.object({
    name: z.string(),
    sortName: z.string().optional(),
    type: z.enum(PerformerType),
    specialty: z.string().optional(),
    musicbrainzId: z.string().optional(),
  }),
}

performers.get('/', async (c) => {
  const all = await db.performer.findMany()
  return c.json(all)
})

performers.get('/:id', async (c) => {
  const performer = await db.performer.findUnique({
    where: { id: c.req.param('id') }
  })

  if (!performer) {
    return c.json({ error: 'Performer not found' }, 404)
  }

  return c.json(performer)
})

performers.post('/', zValidator('json', validationSchemas.create), async (c) => {
  const body = c.req.valid('json')

  const performer = await db.performer.create({
    data: {
      name: body.name,
      sortName: body.sortName,
      type: body.type,
      specialty: body.specialty,
      musicbrainzId: body.musicbrainzId,
    }
  })

  return c.json(performer, 201)
})

export default performers
