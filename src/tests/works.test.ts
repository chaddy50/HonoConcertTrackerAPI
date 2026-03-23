import { describe, it, expect, beforeEach } from 'vitest'
import app from '../index.js'
import { resetDatabase } from './helpers/db.js'
import { createComposer, createWork } from './helpers/fixtures.js'

beforeEach(async () => {
  await resetDatabase()
})

describe('GET /v1/works', () => {
  it('returns an empty array when no works exist', async () => {
    const res = await app.request('/v1/works')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns all works with composers included', async () => {
    const composer = await createComposer({ name: 'Ludwig van Beethoven' })
    await createWork([composer.id], { title: 'Symphony No. 5' })

    const res = await app.request('/v1/works')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Symphony No. 5')
    expect(body[0].composers).toHaveLength(1)
    expect(body[0].composers[0].name).toBe('Ludwig van Beethoven')
  })

  it('returns multiple works', async () => {
    const composer = await createComposer()
    await createWork([composer.id], { title: 'Work One' })
    await createWork([composer.id], { title: 'Work Two' })

    const res = await app.request('/v1/works')
    const body = await res.json() as any[]
    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
  })
})

describe('GET /v1/works/:id', () => {
  it('returns 404 for a non-existent work', async () => {
    const res = await app.request('/v1/works/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('returns the work with all fields and composers when found', async () => {
    const composer = await createComposer({ name: 'Johannes Brahms' })
    const created = await createWork([composer.id], {
      title: 'Symphony No. 1',
      type: 'Symphony',
      key: 'C minor',
      catalogNumber: 'Op. 68',
      musicbrainzId: 'brahms-sym1-mbid',
    })

    const res = await app.request(`/v1/works/${created.id}`)
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.title).toBe('Symphony No. 1')
    expect(body.type).toBe('Symphony')
    expect(body.key).toBe('C minor')
    expect(body.catalogNumber).toBe('Op. 68')
    expect(body.musicbrainzId).toBe('brahms-sym1-mbid')
    expect(body.composers).toHaveLength(1)
    expect(body.composers[0].name).toBe('Johannes Brahms')
  })
})

describe('POST /v1/works', () => {
  it('returns 400 when title is missing', async () => {
    const composer = await createComposer()
    const res = await app.request('/v1/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ composerIds: [composer.id] }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when composerIds is missing', async () => {
    const res = await app.request('/v1/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Work' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when composerIds is empty', async () => {
    const res = await app.request('/v1/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Work', composerIds: [] }),
    })
    expect(res.status).toBe(400)
  })

  it('optional fields default to null when not provided', async () => {
    const composer = await createComposer()
    const body = await createWork([composer.id])
    expect(body.type).toBeNull()
    expect(body.key).toBeNull()
    expect(body.catalogNumber).toBeNull()
    expect(body.musicbrainzId).toBeNull()
  })

  it('creates a work and returns 201', async () => {
    const composer = await createComposer({ name: 'Wolfgang Amadeus Mozart' })
    const res = await app.request('/v1/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Symphony No. 40',
        type: 'Symphony',
        key: 'G minor',
        catalogNumber: 'K. 550',
        musicbrainzId: 'mozart-k550-mbid',
        composerIds: [composer.id],
      }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(201)
    expect(body.id).toBeDefined()
    expect(body.title).toBe('Symphony No. 40')
    expect(body.type).toBe('Symphony')
    expect(body.key).toBe('G minor')
    expect(body.catalogNumber).toBe('K. 550')
    expect(body.musicbrainzId).toBe('mozart-k550-mbid')
    expect(body.composers).toHaveLength(1)
    expect(body.composers[0].name).toBe('Wolfgang Amadeus Mozart')
  })

  it('returns 409 when musicbrainzId is duplicated', async () => {
    const composer = await createComposer()
    await createWork([composer.id], { musicbrainzId: 'duplicate-mbid' })
    const res = await app.request('/v1/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Other Work', composerIds: [composer.id], musicbrainzId: 'duplicate-mbid' }),
    })
    expect(res.status).toBe(409)
  })

  it('links multiple composers to a single work', async () => {
    const composer1 = await createComposer({ name: 'Composer A' })
    const composer2 = await createComposer({ name: 'Composer B' })
    const body = await createWork([composer1.id, composer2.id], { title: 'Collaborative Work' })
    expect(body.composers).toHaveLength(2)
    const names = body.composers.map((c: any) => c.name)
    expect(names).toContain('Composer A')
    expect(names).toContain('Composer B')
  })
})
