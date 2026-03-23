import { describe, it, expect, beforeEach } from 'vitest'
import app from '../index.js'
import { resetDatabase } from './helpers/db.js'
import { createComposer, createPerformance, createPerformer, createSetListEntry, createVenue, createWork } from './helpers/fixtures.js'

beforeEach(async () => {
  await resetDatabase()
})

// Most set-list-entry tests need a full chain of prerequisites:
// composer → work, venue + performer → performance
async function setupPrerequisites() {
  const composer = await createComposer()
  const work = await createWork([composer.id])
  const venue = await createVenue()
  const performer = await createPerformer()
  const performance = await createPerformance(venue.id, [performer.id])
  return { composer, work, venue, performer, performance }
}

describe('POST /v1/set-list-entries', () => {
  it('returns 400 when performanceId is missing', async () => {
    const { work, performer } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workId: work.id,
        order: 1,
        featuredPerformers: [{ performerId: performer.id, role: 'violin' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when workId is missing', async () => {
    const { performance, performer } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performanceId: performance.id,
        order: 1,
        featuredPerformers: [{ performerId: performer.id, role: 'violin' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when order is missing', async () => {
    const { work, performance, performer } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performanceId: performance.id,
        workId: work.id,
        featuredPerformers: [{ performerId: performer.id, role: 'violin' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when order is zero', async () => {
    const { work, performance, performer } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performanceId: performance.id,
        workId: work.id,
        order: 0,
        featuredPerformers: [{ performerId: performer.id, role: 'violin' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when order is negative', async () => {
    const { work, performance, performer } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performanceId: performance.id,
        workId: work.id,
        order: -1,
        featuredPerformers: [{ performerId: performer.id, role: 'violin' }],
      }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when featuredPerformers is missing', async () => {
    const { work, performance } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performanceId: performance.id,
        workId: work.id,
        order: 1,
      }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when featuredPerformers is empty', async () => {
    const { work, performance } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performanceId: performance.id,
        workId: work.id,
        order: 1,
        featuredPerformers: [],
      }),
    })
    expect(res.status).toBe(400)
  })

  it('creates an entry and returns 201 with nested relations', async () => {
    const { work, performance, performer, composer } = await setupPrerequisites()
    const res = await app.request('/v1/set-list-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performanceId: performance.id,
        workId: work.id,
        order: 1,
        featuredPerformers: [{ performerId: performer.id, role: 'piano' }],
      }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(201)
    expect(body.id).toBeDefined()
    expect(body.order).toBe(1)
    expect(body.work.id).toBe(work.id)
    expect(body.work.composers).toHaveLength(1)
    expect(body.work.composers[0].id).toBe(composer.id)
    expect(body.featuredPerformers).toHaveLength(1)
    expect(body.featuredPerformers[0].role).toBe('piano')
    expect(body.featuredPerformers[0].performer.id).toBe(performer.id)
  })

  it('conductor defaults to null when not provided', async () => {
    const { work, performance, performer } = await setupPrerequisites()
    const body = await createSetListEntry(performance.id, work.id, 1, [{ performerId: performer.id, role: 'violin' }])
    expect(body.conductor).toBeNull()
  })

  it('attaches conductor when conductorId is provided', async () => {
    const { work, performance, performer } = await setupPrerequisites()
    const conductor = await createPerformer({ name: 'Herbert von Karajan', type: 'CONDUCTOR' })
    const body = await createSetListEntry(
      performance.id,
      work.id,
      1,
      [{ performerId: performer.id, role: 'violin' }],
      { conductorId: conductor.id }
    )
    expect(body.conductor).not.toBeNull()
    expect(body.conductor.name).toBe('Herbert von Karajan')
  })

  it('allows multiple featured performers with different roles', async () => {
    const { work, performance } = await setupPrerequisites()
    const violinist = await createPerformer({ name: 'Violinist', type: 'SOLO' })
    const cellist = await createPerformer({ name: 'Cellist', type: 'SOLO' })
    const body = await createSetListEntry(performance.id, work.id, 1, [
      { performerId: violinist.id, role: 'violin' },
      { performerId: cellist.id, role: 'cello' },
    ])
    expect(body.featuredPerformers).toHaveLength(2)
    const roles = body.featuredPerformers.map((fp: any) => fp.role)
    expect(roles).toContain('violin')
    expect(roles).toContain('cello')
  })

  it('appears in the parent performance set list after creation', async () => {
    const { work, performance, performer } = await setupPrerequisites()
    await createSetListEntry(performance.id, work.id, 1, [{ performerId: performer.id, role: 'violin' }])

    const perfRes = await app.request(`/v1/performances/${performance.id}`)
    const perfBody = await perfRes.json() as any
    expect(perfBody.setList).toHaveLength(1)
    expect(perfBody.setList[0].work.id).toBe(work.id)
  })
})

describe('PUT /v1/set-list-entries/:id', () => {
  let entryId: string
  let prereqs: Awaited<ReturnType<typeof setupPrerequisites>>

  beforeEach(async () => {
    prereqs = await setupPrerequisites()
    const entry = await createSetListEntry(
      prereqs.performance.id,
      prereqs.work.id,
      1,
      [{ performerId: prereqs.performer.id, role: 'violin' }]
    )
    entryId = entry.id
  })

  it('updates the order', async () => {
    const res = await app.request(`/v1/set-list-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: 3 }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.order).toBe(3)
  })

  it('updates the work', async () => {
    const newWork = await createWork([prereqs.composer.id], { title: 'New Work' })
    const res = await app.request(`/v1/set-list-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId: newWork.id }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.work.id).toBe(newWork.id)
  })

  it('replaces all featured performers when provided', async () => {
    const newPerformer = await createPerformer({ name: 'New Soloist', type: 'SOLO' })
    const res = await app.request(`/v1/set-list-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featuredPerformers: [{ performerId: newPerformer.id, role: 'cello' }] }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.featuredPerformers).toHaveLength(1)
    expect(body.featuredPerformers[0].performer.id).toBe(newPerformer.id)
    expect(body.featuredPerformers[0].role).toBe('cello')
  })

  it('sets a conductor', async () => {
    const conductor = await createPerformer({ name: 'Herbert von Karajan', type: 'CONDUCTOR' })
    const res = await app.request(`/v1/set-list-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId: conductor.id }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.conductor.name).toBe('Herbert von Karajan')
  })

  it('clears conductor when conductorId is null', async () => {
    const conductor = await createPerformer({ name: 'Herbert von Karajan', type: 'CONDUCTOR' })
    await app.request(`/v1/set-list-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId: conductor.id }),
    })

    const res = await app.request(`/v1/set-list-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId: null }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.conductor).toBeNull()
  })

  it('returns the full updated entry with nested relations', async () => {
    const res = await app.request(`/v1/set-list-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: 2 }),
    })
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.id).toBe(entryId)
    expect(body.work).toBeDefined()
    expect(body.work.composers).toBeDefined()
    expect(body.featuredPerformers).toBeDefined()
  })
})

describe('DELETE /v1/set-list-entries/:id', () => {
  it('returns 204 and removes the entry from the performance set list', async () => {
    const { work, performance, performer } = await setupPrerequisites()
    const entry = await createSetListEntry(performance.id, work.id, 1, [{ performerId: performer.id, role: 'violin' }])

    const deleteRes = await app.request(`/v1/set-list-entries/${entry.id}`, { method: 'DELETE' })
    expect(deleteRes.status).toBe(204)

    const perfRes = await app.request(`/v1/performances/${performance.id}`)
    const perfBody = await perfRes.json() as any
    expect(perfBody.setList).toHaveLength(0)
  })

  it('also removes featured performers when deleting an entry', async () => {
    const { work, performance } = await setupPrerequisites()
    const soloist1 = await createPerformer({ name: 'Soloist One', type: 'SOLO' })
    const soloist2 = await createPerformer({ name: 'Soloist Two', type: 'SOLO' })
    const entry = await createSetListEntry(performance.id, work.id, 1, [
      { performerId: soloist1.id, role: 'violin' },
      { performerId: soloist2.id, role: 'cello' },
    ])

    const deleteRes = await app.request(`/v1/set-list-entries/${entry.id}`, { method: 'DELETE' })
    expect(deleteRes.status).toBe(204)

    const perfRes = await app.request(`/v1/performances/${performance.id}`)
    const perfBody = await perfRes.json() as any
    expect(perfBody.setList).toHaveLength(0)
  })
})
