-- Runs once, when Postgres initialises an empty data volume (see 06.06).
-- The API also creates this table at startup; IF NOT EXISTS keeps the two in agreement.
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO notes (id, text) VALUES
  (gen_random_uuid(), 'Welcome to the notes API. This note came from db/seed.sql.'),
  (gen_random_uuid(), 'Edit api/src/server.ts while docker compose watch runs, and the API restarts.'),
  (gen_random_uuid(), 'docker compose down keeps these notes. docker compose down -v deletes them.');
