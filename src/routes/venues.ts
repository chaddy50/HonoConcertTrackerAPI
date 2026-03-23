import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import db from '../db.js'

const venues = new Hono()

const validationSchemas = {
  create: z.object({
    osmType: z.string(),
    osmId: z.string(),
    name: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    formattedAddress: z.string().optional(),
    websiteUri: z.url().optional(),
  }),
}

// BigInt cannot be serialized to JSON natively, so we convert osmId to a string
function serializeVenue(venue: Awaited<ReturnType<typeof db.venue.findUniqueOrThrow>>) {
  return {
    ...venue,
    osmId: venue.osmId.toString(),
  }
}

venues.get('/', async (c) => {
  const all = await db.venue.findMany()
  return c.json(all.map(serializeVenue))
})

venues.get('/:id', async (c) => {
  const venue = await db.venue.findUnique({
    where: { id: c.req.param('id') }
  })

  if (!venue) {
    return c.json({ error: 'Venue not found' }, 404)
  }

  return c.json(serializeVenue(venue))
})

venues.post('/', zValidator('json', validationSchemas.create), async (c) => {
  const body = c.req.valid('json')

  const venue = await db.venue.create({
    data: {
      osmType: body.osmType,
      osmId: BigInt(body.osmId),
      name: body.name,
      city: body.city,
      country: body.country,
      formattedAddress: body.formattedAddress,
      websiteUri: body.websiteUri,
    }
  })

  return c.json(serializeVenue(venue), 201)
})

export default venues
