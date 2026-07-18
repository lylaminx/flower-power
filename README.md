# FlowerPower

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
