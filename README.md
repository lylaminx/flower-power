# FlowerPower

[![CI](https://github.com/lylaminx/flower-power/actions/workflows/ci.yml/badge.svg)](https://github.com/lylaminx/flower-power/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/lylaminx/flower-power)](https://github.com/lylaminx/flower-power/releases/latest)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

An artist-focused 3D botanical studio for shaping, lighting, and exporting floral references.

## Current prototype

The first milestone implements a responsive Next.js editor with:

- A procedural, seeded 3D flower rendered with React Three Fiber
- Twelve species-aware presets including daisy, cosmos, poppy, rose, sunflower,
  peony, lotus, anemone, dahlia, and zinnia
- Live petal count, proportions, curl, bloom, and variation controls
- Editable flower, stem, center, and backdrop colors
- Orbit, pan, zoom, lighting, composition grid, and stem controls
- Natural randomization, local design saving, and PNG export

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The application supports two persistence modes. `database` (the default
outside Vercel) saves and loads designs through PostgreSQL. `file` downloads
designs as versioned JSON files and loads them locally in the browser without
sending their contents to a server:

```bash
NEXT_PUBLIC_PERSISTENCE_MODE=file npm run dev
```

Vercel builds default to file mode, so the repository can be deployed there
without configuring a database. Set `NEXT_PUBLIC_PERSISTENCE_MODE=database`
in a deployment that should use the PostgreSQL API instead.

## Run with Docker Compose

Copy the example environment file and change the database password before using this outside local development:

```bash
cp .env.example .env
docker compose up --build -d
```

The web studio is available at [http://localhost:3000](http://localhost:3000). PostgreSQL is exposed only on the local interface at port `5432`; application containers reach it through the private Compose network. Data is retained in the `postgres-data` volume.

The web health check at `http://localhost:3000/api/health` executes a PostgreSQL query. Compose reports the web service as healthy only when both the application and database are working.

Flower designs are persisted in PostgreSQL when **Save study** is selected. The
schema separates the seeded species catalog, design identity, petal settings,
and scene/stem/leaf settings into `flower_varieties`, `flower_designs`,
`flower_petals`, and `flower_scenes`. The application creates and migrates
these tables idempotently on first use, including for an existing Compose data
volume. `GET /api/flowers` lists saved designs, `GET /api/flowers/:id` restores
a complete design, and `POST /api/flowers` saves the
current design. The Compose initialization SQL contains the complete current
schema and all 42 variety records for new database volumes.

Inspect or stop the stack with:

```bash
docker compose ps
docker compose logs -f web
docker compose down
```

## Container image

Publishing a GitHub Release builds the application image and publishes it to
GitHub Container Registry:

```bash
docker pull ghcr.io/lylaminx/flower-power:latest
```

The workflow publishes immutable `sha-<commit>` tags plus the release's full
semantic version and major/minor alias. Non-prerelease releases also update
`latest`. GitHub creates a new container package as private by default; its
visibility and access can be managed from the package settings.

## Quality checks

```bash
npm run check
npm run build
```

`npm run check` runs formatting, linting, typechecking, and tests with enforced
coverage thresholds. Use `npm test` for a quick test run, `npm run test:watch`
while developing, or `npm run test:coverage` to produce the local HTML report
in `coverage/`. The GitHub Actions workflow runs the checks and production build
on one Ubuntu runner to keep CI usage low, then retains the coverage report as
an artifact for seven days.

## Documentation

Generate the TypeDoc API reference with:

```bash
npm run docs
```

The generated static site is written to `public/docs`. Next.js serves that
directory at [`http://localhost:3000/docs/`](http://localhost:3000/docs/), or
at `{BASE_URL}/docs/` after deployment. `npm run build` generates the docs
automatically, and the Docker image includes them alongside the application.

See [PLAN.md](./PLAN.md) for the product vision and phased roadmap.

## License

FlowerPower is licensed under the [Apache License 2.0](./LICENSE).
