import { Hono } from 'hono'
import db from '../db.js'

const works = new Hono()

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

works.post('/', async (c) => {
  const body = await c.req.json()

  const work = await db.work.create({
    data: {
      title: body.title,
      type: body.type,
      key: body.key,
      catalogNumber: body.catalogNumber,
      musicbrainzId: body.musicbrainzId,
      composers: {
        connect: body.composerIds.map((id: string) => ({ id }))
      }
    },
    include: { composers: true }
  })

  return c.json(work, 201)
})

export default works
