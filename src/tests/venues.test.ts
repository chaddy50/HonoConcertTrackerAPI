import { describe, it, expect, beforeEach } from 'vitest'
import app from '../index.js'
import { resetDatabase } from './helpers/db.js'
import { createVenue } from './helpers/fixtures.js'

beforeEach(async () => {
  await resetDatabase()
})

describe('GET /v1/venues', () => {
  it('returns an empty array when no venues exist', async () => {
    const res = await app.request('/v1/venues')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns all venues', async () => {
    await createVenue({ name: 'Carnegie Hall' })

    const res = await app.request('/v1/venues')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Carnegie Hall')
  })

  it('returns multiple venues', async () => {
    await createVenue({ osmId: '111' })
    await createVenue({ osmId: '222' })

    const res = await app.request('/v1/venues')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
  })
})

describe('GET /v1/venues/:id', () => {
  it('returns 404 for a non-existent venue', async () => {
    const res = await app.request('/v1/venues/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('returns the venue when found', async () => {
    const created = await createVenue({
      name: 'Carnegie Hall',
      city: 'New York',
      country: 'US',
      formattedAddress: '881 7th Ave, New York, NY 10019',
      websiteUri: 'https://www.carnegiehall.org',
      osmType: 'way',
      osmId: '123456789',
    })

    const res = await app.request(`/v1/venues/${created.id}`)
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.name).toBe('Carnegie Hall')
    expect(body.city).toBe('New York')
    expect(body.country).toBe('US')
    expect(body.formattedAddress).toBe('881 7th Ave, New York, NY 10019')
    expect(body.websiteUri).toBe('https://www.carnegiehall.org')
    expect(body.osmType).toBe('way')
    expect(body.osmId).toBe('123456789')
  })
})

describe('POST /v1/venues', () => {
  it('returns 400 when osmType is missing', async () => {
    const res = await app.request('/v1/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ osmId: '123456789' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when osmId is missing', async () => {
    const res = await app.request('/v1/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ osmType: 'way' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when websiteUri is not a valid URL', async () => {
    const res = await app.request('/v1/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ osmType: 'way', osmId: '123456789', websiteUri: 'not-a-url' }),
    })
    expect(res.status).toBe(400)
  })

  it('optional fields default to null when not provided', async () => {
    const body = await createVenue()
    expect(body.name).toBeNull()
    expect(body.city).toBeNull()
    expect(body.country).toBeNull()
    expect(body.formattedAddress).toBeNull()
    expect(body.websiteUri).toBeNull()
  })

  it('creates a venue and returns 201', async () => {
    const res = await app.request('/v1/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        osmType: 'way',
        osmId: '123456789',
        name: 'Carnegie Hall',
        city: 'New York',
        country: 'US',
        formattedAddress: '881 7th Ave, New York, NY 10019',
        websiteUri: 'https://www.carnegiehall.org',
      }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(201)
    expect(body.id).toBeDefined()
    expect(body.osmType).toBe('way')
    expect(body.osmId).toBe('123456789')
    expect(body.name).toBe('Carnegie Hall')
    expect(body.city).toBe('New York')
    expect(body.country).toBe('US')
    expect(body.formattedAddress).toBe('881 7th Ave, New York, NY 10019')
    expect(body.websiteUri).toBe('https://www.carnegiehall.org')
  })

  it('allows the same OSM entity to be used for multiple venues', async () => {
    await createVenue({ osmType: 'way', osmId: '123456789', name: 'Stern Auditorium' })
    const res = await app.request('/v1/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ osmType: 'way', osmId: '123456789', name: 'Zankel Hall' }),
    })
    expect(res.status).toBe(201)
  })

  it('returns osmId as a string', async () => {
    const body = await createVenue({ osmId: '987654321' })
    expect(typeof body.osmId).toBe('string')
    expect(body.osmId).toBe('987654321')
  })
})
