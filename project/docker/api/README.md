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

The full stack (Nginx, API, Postgres, Redis on two networks) is in lesson 05.05. From `project/docker`:

```bash
docker build -t notes-api api
docker network create notes-backend
docker network create notes-frontend
docker volume create notes-pgdata
docker run -d --name notes-db --network notes-backend \
  -e POSTGRES_USER=notes -e POSTGRES_PASSWORD=notes -e POSTGRES_DB=notes \
  -v notes-pgdata:/var/lib/postgresql postgres:18
docker run -d --name notes-cache --network notes-backend redis:8-alpine
docker run -d --name notes --network notes-backend \
  -e DATABASE_URL=postgres://notes:notes@notes-db:5432/notes \
  -e REDIS_URL=redis://notes-cache:6379 notes-api
docker network connect notes-frontend notes
docker run -d --name notes-proxy --network notes-frontend -p 8080:80 \
  -v "$PWD/nginx/default.conf":/etc/nginx/conf.d/default.conf:ro nginx:alpine
curl localhost:8080/notes
```

## Run without Docker

You still need a Postgres to point at.

```bash
npm ci
npm run build
DATABASE_URL=postgres://... npm start
```

Each course step is tagged in this repository: `git checkout docker-step-01` and so on.
