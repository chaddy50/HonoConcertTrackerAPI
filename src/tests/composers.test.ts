import { describe, it, expect, beforeEach } from 'vitest'
import app from '../index.js'
import { resetDatabase } from './helpers/db.js'

beforeEach(async () => {
  await resetDatabase()
})

describe('GET /v1/composers', () => {
  it('returns an empty array when no composers exist', async () => {
    const res = await app.request('/v1/composers')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns all composers', async () => {
    await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Johannes Brahms' }),
    })

    const res = await app.request('/v1/composers')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Johannes Brahms')
  })

  it('returns multiple composers', async () => {
    await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Johannes Brahms' }),
    })
    await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ludwig van Beethoven' }),
    })

    const res = await app.request('/v1/composers')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
  })
})

describe('GET /v1/composers/:id', () => {
  it('returns 404 for a non-existent composer', async () => {
    const res = await app.request('/v1/composers/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('returns the composer when found', async () => {
    const created = await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Johannes Brahms', sortName: 'Brahms, Johannes', musicbrainzId: 'mbid-123' }),
    })
    const { id } = await created.json() as any

    const res = await app.request(`/v1/composers/${id}`)
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.name).toBe('Johannes Brahms')
    expect(body.sortName).toBe('Brahms, Johannes')
    expect(body.musicbrainzId).toBe('mbid-123')
  })
})

describe('POST /v1/composers', () => {
  it('returns 400 when name is missing', async () => {
    const res = await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('creates a composer and returns 201', async () => {
    const res = await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Johannes Brahms', sortName: 'Brahms, Johannes', musicbrainzId: 'brahms-mbid' }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(201)
    expect(body.id).toBeDefined()
    expect(body.name).toBe('Johannes Brahms')
    expect(body.sortName).toBe('Brahms, Johannes')
    expect(body.musicbrainzId).toBe('brahms-mbid')
  })

  it('optional fields default to null when not provided', async () => {
    const res = await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Johannes Brahms' }),
    })
    const body = await res.json() as any
    expect(body.sortName).toBeNull()
    expect(body.musicbrainzId).toBeNull()
  })

  it('returns 409 when musicbrainzId is duplicated', async () => {
    const payload = { name: 'Johannes Brahms', musicbrainzId: 'test-123' }
    await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const res = await app.request('/v1/composers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Brahms Copy', musicbrainzId: 'test-123' }),
    })
    expect(res.status).toBe(409)
  })
})
