import { beforeEach, describe, expect, it } from 'vitest'
import { PerformerType } from '../generated/prisma/index.js'
import app from '../index.js'
import { resetDatabase } from './helpers/db.js'
import { createPerformer } from './helpers/fixtures.js'

beforeEach(async () => {
  await resetDatabase()
})

describe('GET /v1/performers', () => {
  it('returns an empty array when no performers exist', async () => {
    const res = await app.request('/v1/performers')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns one performer', async () => {
    await createPerformer({ name: 'Vienna Philharmonic' })

    const res = await app.request('/v1/performers')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Vienna Philharmonic')
  })

  it('returns multiple performers', async () => {
    await createPerformer({ name: 'Vienna Philharmonic' })
    await createPerformer({ name: 'Berlin Philharmonic' })

    const res = await app.request('/v1/performers')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
  })
})

describe('GET /v1/performers/:id', () => {
  it('returns 404 for a non-existent performer', async () => {
    const res = await app.request('/v1/performers/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('returns the performer when found', async () => {
    const created = await createPerformer({
      name: 'Emanuel Ax',
      type: 'SOLO',
      sortName: 'Ax, Emanuel',
      specialty: 'Piano',
      musicbrainzId: 'ax-mbid',
    })

    const res = await app.request(`/v1/performers/${created.id}`)
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.name).toBe('Emanuel Ax')
    expect(body.type).toBe('SOLO')
    expect(body.sortName).toBe('Ax, Emanuel')
    expect(body.specialty).toBe('Piano')
    expect(body.musicbrainzId).toBe('ax-mbid')
  })
})

describe('POST /v1/performers', () => {
  it('returns 400 when name is missing', async () => {
    const res = await app.request('/v1/performers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ORCHESTRA' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when type is missing', async () => {
    const res = await app.request('/v1/performers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vienna Philharmonic' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when type is not a valid value', async () => {
    const res = await app.request('/v1/performers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vienna Philharmonic', type: 'BAND' }),
    })
    expect(res.status).toBe(400)
  })

  it('optional fields default to null when not provided', async () => {
    const body = await createPerformer()
    expect(body.sortName).toBeNull()
    expect(body.specialty).toBeNull()
    expect(body.musicbrainzId).toBeNull()
  })

  it('creates a performer and returns 201', async () => {
    const res = await app.request('/v1/performers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Emanuel Ax',
        type: 'SOLO',
        sortName: 'Ax, Emanuel',
        specialty: 'Piano',
        musicbrainzId: 'ax-mbid',
      }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(201)
    expect(body.id).toBeDefined()
    expect(body.name).toBe('Emanuel Ax')
    expect(body.type).toBe('SOLO')
    expect(body.sortName).toBe('Ax, Emanuel')
    expect(body.specialty).toBe('Piano')
    expect(body.musicbrainzId).toBe('ax-mbid')
  })

  it('returns 409 when musicbrainzId is duplicated', async () => {
    await createPerformer({ musicbrainzId: 'duplicate-id' })
    const res = await app.request('/v1/performers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Other Performer', type: 'SOLO', musicbrainzId: 'duplicate-id' }),
    })
    expect(res.status).toBe(409)
  })

  it.each(Object.values(PerformerType))('accepts type %s', async (type) => {
    const res = await app.request('/v1/performers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Performer', type }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(201)
    expect(body.type).toBe(type)
  })
})
