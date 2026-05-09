import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import db from '../db.js'
import { handleError } from '../lib/errors.js'

const composers = new Hono()

const validationSchemas = {
  create: z.object({
    name: z.string(),
    sortName: z.string().optional(),
    openOpusId: z.string().optional(),
  }),
}

composers.get('/', async (c) => {
  const all = await db.composer.findMany()
  return c.json(all)
})

composers.get('/:id', async (c) => {
  const composer = await db.composer.findUnique({
    where: { id: c.req.param('id') }
  })

  if (!composer) {
    return c.json({ error: 'Composer not found' }, 404)
  }

  return c.json(composer)
})

composers.post('/', zValidator('json', validationSchemas.create), async (c) => {
  const body = c.req.valid('json')

  try {
    const composer = await db.composer.create({
      data: {
        name: body.name,
        sortName: body.sortName,
        openOpusId: body.openOpusId,
      }
    })

    return c.json(composer, 201)
  } catch (err) {
    return handleError(err, c)
  }
})

export default composers
