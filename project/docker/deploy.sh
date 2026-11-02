#!/usr/bin/env bash
# Deploy or update the notes stack on the machine Docker points at (see 07.07).
# Usage: ./deploy.sh [image]   e.g. ./deploy.sh ghcr.io/sehajmakkar/notes-api:sha-1a2b3c4
set -euo pipefail
cd "$(dirname "$0")"

export NOTES_API_IMAGE="${1:-ghcr.io/sehajmakkar/notes-api:latest}"

if [ ! -s secrets/db_password.txt ]; then
  echo "secrets/db_password.txt is missing. Create it with: openssl rand -base64 24 > secrets/db_password.txt" >&2
  exit 1
fi

echo "Deploying $NOTES_API_IMAGE"
docker compose -f compose.prod.yaml pull --ignore-buildable
docker compose -f compose.prod.yaml up -d --wait
docker compose -f compose.prod.yaml ps
docker image prune -f
