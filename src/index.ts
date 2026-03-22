import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import composers from './routes/composers.js'
import performers from './routes/performers.js'
import venues from './routes/venues.js'
import works from './routes/works.js'
import performances from './routes/performances.js'
import setListEntries from './routes/setListEntries.js'

const app = new Hono()

app.route('/v1/composers', composers)
app.route('/v1/performers', performers)
app.route('/v1/venues', venues)
app.route('/v1/works', works)
app.route('/v1/performances', performances)
app.route('/v1/set-list-entries', setListEntries)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
