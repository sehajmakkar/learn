"use client";

// Fixed-size versus content-defined chunking. Edit the text and see which chunks a sync would have to upload again:
// chunks whose exact content the server doesn't already have from the original.
import { useState } from "react";

const ORIGINAL =
  "Summer campaign brief. Goal: drive visits to the summer sale from social posts and the newsletter. " +
  "Links: one short link per channel so clicks can be compared. Budget is split between paid social and creators. " +
  "Creators get a custom code each, and their links point at the sale page with tracking parameters. " +
  "Reporting: daily clicks per link, unique visitors per channel, and the top referrers. " +
  "Risks: the sale page is slow on mobile, and two creators posted the wrong link last year. " +
  "Next steps: confirm the creator list, check every destination, and schedule the newsletter for Monday morning.";

// Gear-style rolling hash: the hash depends only on the last few dozen characters, so cut points follow content.
const GEAR = Array.from({ length: 256 }, (_, i) => {
  let x = (i + 1) * 0x9e3779b1;
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  return x >>> 0;
});

function contentChunks(text: string, mask = 0x0f, min = 8, max = 96): string[] {
  const out: string[] = [];
  let start = 0;
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 1) + GEAR[text.charCodeAt(i) & 255]) >>> 0;
    const len = i - start + 1;
    if ((len >= min && (h & mask) === 0) || len >= max) {
      out.push(text.slice(start, i + 1));
      start = i + 1;
      h = 0;
    }
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

function fixedChunks(text: string, size = 32): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

function Chunks({ title, chunks, known }: { title: string; chunks: string[]; known: Set<string> }) {
  const fresh = chunks.filter((c) => !known.has(c)).length;
  return (
    <div className="border border-line p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">{title}</p>
        <p className={`font-mono text-[0.75rem] tabular-nums ${fresh ? "text-[var(--danger)]" : "text-ink-2"}`}>
          {fresh} of {chunks.length} to upload
        </p>
      </div>
      <p className="mt-2 font-mono text-[0.72rem] leading-[1.9] break-all">
        {chunks.map((c, i) => (
          <span
            key={i}
            className="px-px"
            style={{
              background: known.has(c) ? (i % 2 ? "var(--paper-2)" : "transparent") : "color-mix(in srgb, var(--danger) 22%, transparent)",
              boxShadow: "inset -1px 0 0 var(--line)",
            }}
          >
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}

export function ChunkingLab() {
  const [text, setText] = useState(ORIGINAL);
  const knownFixed = new Set(fixedChunks(ORIGINAL));
  const knownContent = new Set(contentChunks(ORIGINAL));
  const btn = "border border-line px-2.5 py-1 font-mono text-[0.75rem] text-ink-2 hover:border-ink-2";

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => setText((t) => "DRAFT. " + t)}>
          Insert a word at the start
        </button>
        <button type="button" className={btn} onClick={() => setText((t) => t.replace("Monday", "Tuesday"))}>
          Change a word near the end
        </button>
        <button type="button" className={btn} onClick={() => setText((t) => t.replace(" Budget is split between paid social and creators.", ""))}>
          Delete a sentence
        </button>
        <button type="button" className={btn} onClick={() => setText(ORIGINAL)}>
          Start over
        </button>
      </div>
      <label className="mt-4 block">
        <span className="text-[0.85rem] text-ink-2">The file (edit it freely)</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="mt-1.5 w-full border border-line bg-paper px-3 py-2 font-mono text-[0.78rem] text-ink outline-none focus:border-ink-2"
        />
      </label>
      <div className="mt-4 space-y-3">
        <Chunks title="Fixed 32-character chunks" chunks={fixedChunks(text)} known={knownFixed} />
        <Chunks title="Content-defined chunks" chunks={contentChunks(text)} known={knownContent} />
      </div>
      <p className="mt-2 font-mono text-[0.68rem] text-muted">Shaded red: chunks the server doesn&apos;t have yet, so they must be uploaded.</p>
    </div>
  );
}
