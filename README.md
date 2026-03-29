# Overview
This is a REST API for logging classical music concert attendance. 
Classical concerts have a more complex structure than typical events — a single performance can include multiple works, each potentially with its own conductor and featured soloists. 
The API models this using a set list structure with per-entry performer overrides.

It is intended to serve as a backend for future web and mobile clients.

# Features

## Classical Music Domain Modeling
Concerts are structured as Performances containing an ordered set list of Works.

Each set list entry supports its own conductor and featured performers, separate from the top-level performance — needed for programs where a guest conductor leads only specific pieces.

Works include catalog number (Op., BWV, K., etc.) and key, allowing different arrangements of the same composition to be distinguished.

Performers are categorized by type (Orchestra, Ensemble, Conductor, Solo, Chorus).

Venues store a formatted address and website, and link to an [OpenStreetMap](https://www.openstreetmap.org/) entity.

## API Design
Versioned REST endpoints under `/v1/` with nested relation data in responses.

Input validation using Zod schemas on all routes.

Prisma error codes are handled centrally and mapped to appropriate HTTP responses (404, 409, 503, etc.).

Performance listing supports `orderBy` and `order` query parameters.

## Testing
Integration tests using Vitest — all tests run against a real PostgreSQL database.

Test database is provisioned via Testcontainers, which spins up a Postgres 17 Docker container and runs all migrations before the test suite starts.

Database state is reset between each test using `TRUNCATE ... CASCADE`.

CI runs on every push and pull request via GitHub Actions.

# Technical Details
This API was built with [TypeScript](https://www.typescriptlang.org/) and [Hono](https://hono.dev/) running on [Node.js](https://nodejs.org/en).

## Libraries
[PostgreSQL](https://www.postgresql.org/) for the database.
<br>
[Prisma ORM](https://www.prisma.io/) for database access and migrations.
<br>
[`@prisma/adapter-pg`](https://www.npmjs.com/package/@prisma/adapter-pg) to connect Prisma to PostgreSQL.
<br>
[Zod](https://zod.dev/) with `@hono/zod-validator` for validating requests sent to the API.
<br>
[Vitest](https://vitest.dev/) for automated testing.
<br>
[Testcontainers](https://testcontainers.com/) for running a test PostgreSQL database.
<br>
[Docker](https://www.docker.com/) with compose for self-hosting.

## External APIs
[MusicBrainz](https://musicbrainz.org/) for metadata enrichment for performers, composers, and works.
<br>
[OpenStreetMap](https://www.openstreetmap.org/) for choosing and linking to venues.
