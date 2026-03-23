import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handleError } from './lib/errors.js'
import composers from './routes/composers.js'
import performances from './routes/performances.js'
import performers from './routes/performers.js'
import setListEntries from './routes/setListEntries.js'
import venues from './routes/venues.js'
import works from './routes/works.js'

const app = new Hono()

// CORS allows browsers to make requests to this API from a different origin (domain/port).
// Without this, the web frontend would be blocked by the browser's same-origin policy.
// The default allows all origins (*), which can be restricted to specific domains later.
app.use(cors())
app.onError(handleError)

app.route('/v1/composers', composers)
app.route('/v1/performers', performers)
app.route('/v1/venues', venues)
app.route('/v1/works', works)
app.route('/v1/performances', performances)
app.route('/v1/set-list-entries', setListEntries)

export default app

if (process.env.NODE_ENV !== 'test') {
  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}
