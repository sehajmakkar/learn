# notes-api

The app you containerise in the Docker course at learn.sehaj.tech/docker. A small JSON API backed by
Postgres, written in TypeScript so the build needs a compile step.

| Endpoint | Does |
| --- | --- |
| `GET /healthz` | `{"status":"ok"}` |
| `GET /notes` | all notes |
| `POST /notes` | body `{"text": "..."}`, creates a note |

Notes are stored in Postgres. The API needs `DATABASE_URL` and waits up to 30 seconds for the database at startup.

| Variable | Default | |
| --- | --- | --- |
| `DATABASE_URL` | none (required) | e.g. `postgres://notes:notes@notes-db:5432/notes` |
| `PORT` | `3000` | |
| `MAX_NOTE_LENGTH` | `280` | |
| `REDIS_URL` | none (optional) | e.g. `redis://notes-cache:6379`; caches `GET /notes` for 30s |

## Run with Docker

From `project/docker`, one command starts Nginx, the API, Postgres and Redis, seeds the database and reloads the API
as you edit (lesson 06.06):

```bash
cp .env.example .env   # optional; defaults work without it
docker compose up --watch
curl localhost:8080/notes
```

`docker compose down` stops everything and keeps the data; `docker compose down -v` also deletes it. Add
`--profile tools` for Adminer, a database UI, on `localhost:8081`.

The same stack started with plain `docker` commands is in lesson 05.05 (`git checkout docker-step-04`).

## Run without Docker

You still need a Postgres to point at.

```bash
npm ci
npm run build
DATABASE_URL=postgres://... npm start
```

Each course step is tagged in this repository: `git checkout docker-step-01` and so on.
