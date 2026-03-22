import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import db from '../db.js'

const works = new Hono()

const validationSchemas = {
  create: z.object({
    title: z.string(),
    type: z.string().optional(),
    key: z.string().optional(),
    catalogNumber: z.string().optional(),
    musicbrainzId: z.string().optional(),
    composerIds: z.array(z.string()).min(1),
  }),
}

works.get('/', async (c) => {
  const all = await db.work.findMany({
    include: { composers: true }
  })
  return c.json(all)
})

works.get('/:id', async (c) => {
  const work = await db.work.findUnique({
    where: { id: c.req.param('id') },
    include: { composers: true }
  })

  if (!work) {
    return c.json({ error: 'Work not found' }, 404)
  }

  return c.json(work)
})

works.post('/', zValidator('json', validationSchemas.create), async (c) => {
  const body = c.req.valid('json')

  const work = await db.work.create({
    data: {
      title: body.title,
      type: body.type,
      key: body.key,
      catalogNumber: body.catalogNumber,
      musicbrainzId: body.musicbrainzId,
      composers: {
        connect: body.composerIds.map((id) => ({ id }))
      }
    },
    include: { composers: true }
  })

  return c.json(work, 201)
})

export default works
