import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import db from '../db.js'

const setListEntries = new Hono()

const featuredPerformerSchema = z.object({
  performerId: z.string(),
  role: z.string(),
})

const validationSchemas = {
  create: z.object({
    performanceId: z.string(),
    workId: z.string(),
    order: z.number().int().positive(),
    notes: z.string().optional(),
    conductorId: z.string().optional(),
    featuredPerformers: z.array(featuredPerformerSchema).min(1),
  }),
  update: z.object({
    workId: z.string().optional(),
    order: z.number().int().positive().optional(),
    notes: z.string().optional(),
    conductorId: z.string().nullable().optional(),
    featuredPerformers: z.array(featuredPerformerSchema).min(1).optional(),
  }),
}

const relationsToInclude = {
  work: {
    include: { composers: true }
  },
  conductor: true,
  featuredPerformers: {
    include: { performer: true }
  }
}

setListEntries.post('/', zValidator('json', validationSchemas.create), async (c) => {
  const body = c.req.valid('json')

  const entry = await db.setListEntry.create({
    data: {
      order: body.order,
      notes: body.notes,
      performance: { connect: { id: body.performanceId } },
      work: { connect: { id: body.workId } },
      conductor: body.conductorId
        ? { connect: { id: body.conductorId } }
        : undefined,
      featuredPerformers: {
        create: body.featuredPerformers.map((featuredPerformer) => ({
          performerId: featuredPerformer.performerId,
          role: featuredPerformer.role,
        }))
      }
    },
    include: relationsToInclude
  })

  return c.json(entry, 201)
})

setListEntries.put('/:id', zValidator('json', validationSchemas.update), async (c) => {
  const body = c.req.valid('json')
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
        notes: body.notes,
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
              create: body.featuredPerformers.map((featuredPerformer) => ({
                performerId: featuredPerformer.performerId,
                role: featuredPerformer.role,
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
