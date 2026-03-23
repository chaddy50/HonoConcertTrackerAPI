import app from '../../index.js'

function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function createComposer(overrides: Record<string, unknown> = {}) {
  const res = await post('/v1/composers', { name: 'Test Composer', ...overrides })
  return res.json() as Promise<any>
}

export async function createPerformer(overrides: Record<string, unknown> = {}) {
  const res = await post('/v1/performers', { name: 'Test Performer', type: 'ORCHESTRA', ...overrides })
  return res.json() as Promise<any>
}

export async function createVenue(overrides: Record<string, unknown> = {}) {
  const res = await post('/v1/venues', { osmType: 'way', osmId: '123456789', ...overrides })
  return res.json() as Promise<any>
}

export async function createWork(composerIds: string[], overrides: Record<string, unknown> = {}) {
  const res = await post('/v1/works', { title: 'Test Work', composerIds, ...overrides })
  return res.json() as Promise<any>
}

export async function createPerformance(
  venueId: string,
  performerIds: string[],
  overrides: Record<string, unknown> = {}
) {
  const res = await post('/v1/performances', {
    date: '2025-03-15T19:30:00.000Z',
    venueId,
    performerIds,
    ...overrides,
  })
  return res.json() as Promise<any>
}

export async function createSetListEntry(
  performanceId: string,
  workId: string,
  order: number,
  featuredPerformers: { performerId: string; role: string }[],
  overrides: Record<string, unknown> = {}
) {
  const res = await post('/v1/set-list-entries', {
    performanceId,
    workId,
    order,
    featuredPerformers,
    ...overrides,
  })
  return res.json() as Promise<any>
}
