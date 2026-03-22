import { Hono } from 'hono'
import db from '../db.js'

const setListEntries = new Hono()

const relationsToInclude = {
  work: {
    include: { composers: true }
  },
  conductor: true,
  featuredPerformers: {
    include: { performer: true }
  }
}

setListEntries.post('/', async (c) => {
  const body = await c.req.json()

  const entry = await db.setListEntry.create({
    data: {
      order: body.order,
      performance: { connect: { id: body.performanceId } },
      work: { connect: { id: body.workId } },
      conductor: body.conductorId
        ? { connect: { id: body.conductorId } }
        : undefined,
      featuredPerformers: {
        create: body.featuredPerformers.map((fp: { performerId: string, role: string }) => ({
          performerId: fp.performerId,
          role: fp.role,
        }))
      }
    },
    include: relationsToInclude
  })

  return c.json(entry, 201)
})

setListEntries.put('/:id', async (c) => {
  const body = await c.req.json()
  const id = c.req.param('id')

  // Delete and recreate featuredPerformers since the junction table has
  // a composite key that makes individual updates impractical
  const entry = await db.$transaction(async (tx) => {
    if (body.featuredPerformers) {
      await tx.setListPerformer.deleteMany({
        where: { setListEntryId: id }
      })
    }

    return tx.setListEntry.update({
      where: { id },
      data: {
        order: body.order,
        work: body.workId
          ? { connect: { id: body.workId } }
          : undefined,
        conductor: body.conductorId
          ? { connect: { id: body.conductorId } }
          : body.conductorId === null
            ? { disconnect: true }
            : undefined,
        featuredPerformers: body.featuredPerformers
          ? {
              create: body.featuredPerformers.map((fp: { performerId: string, role: string }) => ({
                performerId: fp.performerId,
                role: fp.role,
              }))
            }
          : undefined,
      },
      include: relationsToInclude
    })
  })

  return c.json(entry)
})

setListEntries.delete('/:id', async (c) => {
  const id = c.req.param('id')

  // Delete featured performers first due to foreign key constraints
  await db.setListPerformer.deleteMany({
    where: { setListEntryId: id }
  })

  await db.setListEntry.delete({
    where: { id }
  })

  return c.body(null, 204)
})

export default setListEntries
