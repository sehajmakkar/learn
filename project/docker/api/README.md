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

## Run with Docker

```bash
docker network create notes-net
docker volume create notes-pgdata
docker run -d --name notes-db --network notes-net \
  -e POSTGRES_USER=notes -e POSTGRES_PASSWORD=notes -e POSTGRES_DB=notes \
  -v notes-pgdata:/var/lib/postgresql postgres:18
docker build -t notes-api .
docker run -d --name notes --network notes-net -p 8080:3000 \
  -e DATABASE_URL=postgres://notes:notes@notes-db:5432/notes notes-api
curl localhost:8080/healthz
```

## Run without Docker

You still need a Postgres to point at.

```bash
npm ci
npm run build
DATABASE_URL=postgres://... npm start
```

Each course step is tagged in this repository: `git checkout docker-step-01` and so on.
