// A deliberately small notes API: enough moving parts to containerise, nothing more.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

type Note = { id: string; text: string; createdAt: string };

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
const notes: Note[] = [];

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/healthz") return send(res, 200, { status: "ok" });
    if (req.method === "GET" && req.url === "/notes") return send(res, 200, notes);
    if (req.method === "POST" && req.url === "/notes") {
      const { text } = (await readJson(req)) as { text?: unknown };
      if (typeof text !== "string" || !text.trim()) return send(res, 400, { error: "text is required" });
      if (text.length > maxNoteLength) return send(res, 400, { error: `text is longer than ${maxNoteLength} characters` });
      const note = { id: randomUUID(), text, createdAt: new Date().toISOString() };
      notes.push(note);
      return send(res, 201, note);
    }
    send(res, 404, { error: "not found" });
  } catch {
    send(res, 400, { error: "invalid JSON" });
  }
});

server.listen(port, () => console.log(`notes-api listening on :${port} (max note length ${maxNoteLength})`));

// docker stop sends SIGTERM. As PID 1 we must handle it ourselves (see 01.03).
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing");
  server.close(() => process.exit(0));
});
