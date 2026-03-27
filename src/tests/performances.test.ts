import { describe, it, expect, beforeEach } from 'vitest'
import { PerformanceStatus } from '../generated/prisma/index.js'
import app from '../index.js'
import { resetDatabase } from './helpers/db.js'
import { createComposer, createPerformance, createPerformer, createVenue, createWork } from './helpers/fixtures.js'

beforeEach(async () => {
  await resetDatabase()
})

describe('GET /v1/performances', () => {
  it('returns an empty array when no performances exist', async () => {
    const res = await app.request('/v1/performances')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns all performances with relations included', async () => {
    const venue = await createVenue({ name: 'Carnegie Hall' })
    const performer = await createPerformer({ name: 'Vienna Philharmonic' })
    await createPerformance(venue.id, [performer.id])

    const res = await app.request('/v1/performances')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].venue.name).toBe('Carnegie Hall')
    expect(body[0].performers).toHaveLength(1)
    expect(body[0].performers[0].name).toBe('Vienna Philharmonic')
    expect(body[0].setList).toEqual([])
  })

  it('returns multiple performances', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    await createPerformance(venue.id, [performer.id], { date: '2025-03-15T19:30:00.000Z' })
    await createPerformance(venue.id, [performer.id], { date: '2025-03-16T19:30:00.000Z' })

    const res = await app.request('/v1/performances')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
  })

  it('returns performances sorted by date desc by default', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const p1 = await createPerformance(venue.id, [performer.id], { date: '2025-01-01T00:00:00.000Z' })
    const p2 = await createPerformance(venue.id, [performer.id], { date: '2026-01-01T00:00:00.000Z' })

    const res = await app.request('/v1/performances')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    expect(body[0].id).toBe(p2.id)
    expect(body[1].id).toBe(p1.id)
  })

  it('returns performances sorted by date asc when order=asc', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const p1 = await createPerformance(venue.id, [performer.id], { date: '2025-01-01T00:00:00.000Z' })
    const p2 = await createPerformance(venue.id, [performer.id], { date: '2026-01-01T00:00:00.000Z' })

    const res = await app.request('/v1/performances?order=asc')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    expect(body[0].id).toBe(p1.id)
    expect(body[1].id).toBe(p2.id)
  })

  it('returns 400 for an invalid orderBy field', async () => {
    const res = await app.request('/v1/performances?orderBy=invalid')
    expect(res.status).toBe(400)
  })
})

describe('GET /v1/performances/:id', () => {
  it('returns 404 for a non-existent performance', async () => {
    const res = await app.request('/v1/performances/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('returns the performance with all relations when found', async () => {
    const venue = await createVenue({ name: 'Carnegie Hall' })
    const performer = await createPerformer({ name: 'Vienna Philharmonic' })
    const conductor = await createPerformer({ name: 'Gustavo Dudamel', type: 'CONDUCTOR' })
    const created = await createPerformance(venue.id, [performer.id], {
      date: '2025-06-20T20:00:00.000Z',
      status: 'ATTENDED',
      notes: 'Excellent concert',
      conductorId: conductor.id,
    })

    const res = await app.request(`/v1/performances/${created.id}`)
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.date).toBe('2025-06-20T20:00:00.000Z')
    expect(body.status).toBe('ATTENDED')
    expect(body.notes).toBe('Excellent concert')
    expect(body.venue.name).toBe('Carnegie Hall')
    expect(body.performers).toHaveLength(1)
    expect(body.performers[0].name).toBe('Vienna Philharmonic')
    expect(body.conductor.name).toBe('Gustavo Dudamel')
    expect(body.setList).toEqual([])
  })
})

describe('POST /v1/performances', () => {
  it('returns 400 when date is missing', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const res = await app.request('/v1/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: venue.id, performerIds: [performer.id] }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when date is not a valid ISO datetime', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const res = await app.request('/v1/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: 'not-a-date', venueId: venue.id, performerIds: [performer.id] }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when venueId is missing', async () => {
    const performer = await createPerformer()
    const res = await app.request('/v1/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-03-15T19:30:00.000Z', performerIds: [performer.id] }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when performerIds is missing', async () => {
    const venue = await createVenue()
    const res = await app.request('/v1/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-03-15T19:30:00.000Z', venueId: venue.id }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when performerIds is empty', async () => {
    const venue = await createVenue()
    const res = await app.request('/v1/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-03-15T19:30:00.000Z', venueId: venue.id, performerIds: [] }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when status is not a valid value', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const res = await app.request('/v1/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2025-03-15T19:30:00.000Z', venueId: venue.id, performerIds: [performer.id], status: 'INVALID' }),
    })
    expect(res.status).toBe(400)
  })

  it('status defaults to UPCOMING when not provided', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const body = await createPerformance(venue.id, [performer.id])
    expect(body.status).toBe('UPCOMING')
  })

  it('optional fields default to null when not provided', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const body = await createPerformance(venue.id, [performer.id])
    expect(body.notes).toBeNull()
    expect(body.conductor).toBeNull()
  })

  it('creates a performance and returns 201', async () => {
    const venue = await createVenue({ name: 'Carnegie Hall' })
    const performer = await createPerformer({ name: 'Vienna Philharmonic' })
    const res = await app.request('/v1/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2025-06-20T20:00:00.000Z',
        status: 'UPCOMING',
        notes: 'Front row seats',
        venueId: venue.id,
        performerIds: [performer.id],
      }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(201)
    expect(body.id).toBeDefined()
    expect(body.date).toBe('2025-06-20T20:00:00.000Z')
    expect(body.status).toBe('UPCOMING')
    expect(body.notes).toBe('Front row seats')
    expect(body.venue.id).toBe(venue.id)
    expect(body.performers).toHaveLength(1)
    expect(body.performers[0].id).toBe(performer.id)
  })

  it.each(Object.values(PerformanceStatus))('accepts status %s', async (status) => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const body = await createPerformance(venue.id, [performer.id], { status })
    expect(body.status).toBe(status)
  })

  it('links multiple performers to a performance', async () => {
    const venue = await createVenue()
    const performer1 = await createPerformer({ name: 'Vienna Philharmonic' })
    const performer2 = await createPerformer({ name: 'Berlin Philharmonic' })
    const body = await createPerformance(venue.id, [performer1.id, performer2.id])
    expect(body.performers).toHaveLength(2)
    const names = body.performers.map((p: any) => p.name)
    expect(names).toContain('Vienna Philharmonic')
    expect(names).toContain('Berlin Philharmonic')
  })

  it('attaches conductor when conductorId is provided', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const conductor = await createPerformer({ name: 'Gustavo Dudamel', type: 'CONDUCTOR' })
    const body = await createPerformance(venue.id, [performer.id], { conductorId: conductor.id })
    expect(body.conductor).not.toBeNull()
    expect(body.conductor.name).toBe('Gustavo Dudamel')
  })
})

describe('PUT /v1/performances/:id', () => {
  let performanceId: string
  let venueId: string
  let performerId: string

  beforeEach(async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const performance = await createPerformance(venue.id, [performer.id])
    performanceId = performance.id
    venueId = venue.id
    performerId = performer.id
  })

  it('updates the date', async () => {
    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-01-01T18:00:00.000Z' }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.date).toBe('2026-01-01T18:00:00.000Z')
  })

  it('updates the status', async () => {
    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ATTENDED' }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.status).toBe('ATTENDED')
  })

  it('updates the notes', async () => {
    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Incredible performance' }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.notes).toBe('Incredible performance')
  })

  it('updates the venue', async () => {
    const newVenue = await createVenue({ osmId: '999999999', name: 'Royal Albert Hall' })
    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: newVenue.id }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.venue.id).toBe(newVenue.id)
  })

  it('replaces performers when performerIds is provided', async () => {
    const newPerformer = await createPerformer({ name: 'Berlin Philharmonic' })
    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performerIds: [newPerformer.id] }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.performers).toHaveLength(1)
    expect(body.performers[0].id).toBe(newPerformer.id)
  })

  it('sets a conductor', async () => {
    const conductor = await createPerformer({ name: 'Andris Nelsons', type: 'CONDUCTOR' })
    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId: conductor.id }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.conductor.name).toBe('Andris Nelsons')
  })

  it('clears conductor when conductorId is null', async () => {
    const conductor = await createPerformer({ name: 'Andris Nelsons', type: 'CONDUCTOR' })
    await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId: conductor.id }),
    })

    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId: null }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.conductor).toBeNull()
  })

  it('returns the full updated performance with relations', async () => {
    const res = await app.request(`/v1/performances/${performanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.id).toBe(performanceId)
    expect(body.venue).toBeDefined()
    expect(body.performers).toBeDefined()
    expect(body.setList).toBeDefined()
  })
})

describe('DELETE /v1/performances/:id', () => {
  it('returns 204 and removes the performance', async () => {
    const venue = await createVenue()
    const performer = await createPerformer()
    const performance = await createPerformance(venue.id, [performer.id])

    const deleteRes = await app.request(`/v1/performances/${performance.id}`, {
      method: 'DELETE',
    })
    expect(deleteRes.status).toBe(204)

    const getRes = await app.request(`/v1/performances/${performance.id}`)
    expect(getRes.status).toBe(404)
  })
})
