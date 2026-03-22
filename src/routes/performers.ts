import { Hono } from 'hono'
import db from '../db.js'

const performers = new Hono()

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

performers.post('/', async (c) => {
  const body = await c.req.json()

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
