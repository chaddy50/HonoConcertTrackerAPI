import { Hono } from 'hono'
import db from '../db.js'

const venues = new Hono()

// BigInt cannot be serialized to JSON natively, so we convert osmId to a string
function serializeVenue(venue: Awaited<ReturnType<typeof db.venue.findUniqueOrThrow>>) {
  return {
    ...venue,
    osmId: venue.osmId?.toString() ?? null,
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

venues.post('/', async (c) => {
  const body = await c.req.json()

  const venue = await db.venue.create({
    data: {
      name: body.name,
      city: body.city,
      country: body.country,
      formattedAddress: body.formattedAddress,
      websiteUri: body.websiteUri,
      osmType: body.osmType,
      osmId: body.osmId ? BigInt(body.osmId) : null,
    }
  })

  return c.json(serializeVenue(venue), 201)
})

export default venues
