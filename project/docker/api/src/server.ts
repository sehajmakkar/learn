// A deliberately small notes API: enough moving parts to containerise, nothing more.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createClient } from "redis";

// All configuration comes from the environment (see 03.03). Bad config fails fast at startup.
function intFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`config error: ${name} must be a positive integer, got "${raw}"`);
    process.exit(1);
  }
  return value;
}

const port = intFromEnv("PORT", 3000);
const maxNoteLength = intFromEnv("MAX_NOTE_LENGTH", 280);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("config error: DATABASE_URL is required, e.g. postgres://notes:notes@notes-db:5432/notes");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

// Redis is optional and only a cache (see 05.05): if it's missing or down, every request goes to Postgres.
const redisUrl = process.env.REDIS_URL;
const cache = redisUrl ? createClient({ url: redisUrl }) : null;
cache?.on("error", (err: Error) => console.error("redis error:", err.message));
const CACHE_KEY = "notes:all";

async function cached<T>(load: () => Promise<T>): Promise<{ value: T; hit: boolean }> {
  if (cache?.isReady) {
    try {
      const hit = await cache.get(CACHE_KEY);
      if (hit) return { value: JSON.parse(hit) as T, hit: true };
    } catch {
      // fall through to the database
    }
  }
  const value = await load();
  if (cache?.isReady) await cache.set(CACHE_KEY, JSON.stringify(value), { EX: 30 }).catch(() => {});
  return { value, hit: false };
}

// The database container may still be starting when we start (see 04.05), so retry for a while before giving up.
async function waitForDatabase(attempts = 15) {
  for (let i = 1; ; i++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`database not ready (attempt ${i}/${attempts}), retrying in 2s`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req, res) => {
  try {
    // Health stays cheap and doesn't touch the database (see 03.07).
    if (req.method === "GET" && req.url === "/healthz") return send(res, 200, { status: "ok" });
    if (req.method === "GET" && req.url === "/notes") {
      const { value, hit } = await cached(async () => {
        const { rows } = await pool.query('SELECT id, text, created_at AS "createdAt" FROM notes ORDER BY created_at');
        return rows;
      });
      return send(res, 200, value, { "x-cache": hit ? "hit" : "miss" });
    }
    if (req.method === "POST" && req.url === "/notes") {
      const { text } = (await readJson(req)) as { text?: unknown };
      if (typeof text !== "string" || !text.trim()) return send(res, 400, { error: "text is required" });
      if (text.length > maxNoteLength) return send(res, 400, { error: `text is longer than ${maxNoteLength} characters` });
      const { rows } = await pool.query(
        'INSERT INTO notes (id, text) VALUES ($1, $2) RETURNING id, text, created_at AS "createdAt"',
        [randomUUID(), text],
      );
      if (cache?.isReady) await cache.del(CACHE_KEY).catch(() => {});
      return send(res, 201, rows[0]);
    }
    send(res, 404, { error: "not found" });
  } catch (err) {
    if (err instanceof SyntaxError) return send(res, 400, { error: "invalid JSON" });
    console.error(err);
    send(res, 500, { error: "internal error" });
  }
});

// Don't wait for Redis: the API works without it, and the client keeps reconnecting in the background.
cache?.connect().catch((err: Error) => console.error("redis unavailable, serving without cache:", err.message));

try {
  await waitForDatabase();
  await pool.query(
    "CREATE TABLE IF NOT EXISTS notes (id uuid PRIMARY KEY, text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())",
  );
} catch (err) {
  console.error("could not reach the database, exiting:", (err as Error).message);
  process.exit(1);
}

server.listen(port, () => console.log(`notes-api listening on :${port} (max note length ${maxNoteLength})`));

// docker stop sends SIGTERM. As PID 1 we must handle it ourselves (see 01.03).
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing");
  server.close(async () => {
    await cache?.close().catch(() => {});
    await pool.end();
    process.exit(0);
  });
});
