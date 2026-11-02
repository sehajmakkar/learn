# notes-api

The app you containerise in the Docker course at learn.sehaj.tech/docker. A small JSON API with no runtime
dependencies, written in TypeScript so the build needs a compile step.

| Endpoint | Does |
| --- | --- |
| `GET /healthz` | `{"status":"ok"}` |
| `GET /notes` | all notes |
| `POST /notes` | body `{"text": "..."}`, creates a note |

Notes live in memory for now. Later course steps move them to Postgres.

## Run with Docker

```bash
docker build -t notes-api .
docker run -d --name notes -p 8080:3000 notes-api
curl localhost:8080/healthz
```

## Run without Docker

```bash
npm ci
npm run build
npm start
```

Each course step is tagged in this repository: `git checkout docker-step-01` and so on.
