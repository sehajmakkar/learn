"use client";

// Why indexes work: a B-tree with hundreds of keys per page stays only a few levels deep, even for billions of rows,
// while a full scan reads every page. Times use the SSD numbers from lesson 01.04.
import { useState } from "react";

const PAGE = 8192; // bytes per page, Postgres's default
const RANDOM_READ_US = 16; // one random 8 KB read from an SSD
const SEQ_US_PER_MB = 49; // sequential SSD read

function compact(n: number) {
  if (n >= 1e9) return `${+(n / 1e9).toPrecision(3)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toPrecision(3)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toPrecision(3)}K`;
  return Math.round(n).toString();
}

function bytes(n: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${+n.toPrecision(3)} ${units[i]}`;
}

function time(us: number) {
  if (us >= 60e6) return `${+(us / 60e6).toPrecision(2)} min`;
  if (us >= 1e6) return `${+(us / 1e6).toPrecision(2)} s`;
  if (us >= 1e3) return `${+(us / 1e3).toPrecision(2)} ms`;
  return `${Math.round(us)} µs`;
}

export function BTreeLab({ preset }: { preset?: { rows?: number; fanout?: number; rowBytes?: number } }) {
  const [rows, setRows] = useState(preset?.rows ?? 600_000_000);
  const [fanout, setFanout] = useState(preset?.fanout ?? 300);
  const [rowBytes, setRowBytes] = useState(preset?.rowBytes ?? 500);

  // Build the tree from the bottom: each leaf page holds `fanout` keys, each level above points to `fanout` pages.
  const perLevel: number[] = [Math.max(1, Math.ceil(rows / fanout))];
  while (perLevel[0] > 1) perLevel.unshift(Math.ceil(perLevel[0] / fanout));
  const levels = perLevel.length;
  const indexReads = levels + 1; // walk the tree, then fetch the row from the table
  const tablePages = Math.ceil(rows / Math.max(1, Math.floor(PAGE / rowBytes)));
  const scanUs = ((tablePages * PAGE) / 1e6) * SEQ_US_PER_MB;
  const lookupUs = indexReads * RANDOM_READ_US;
  // Upper levels whose pages fit in 1 GB of memory stay cached, so only the lower levels touch disk.
  let cachedLevels = 0;
  let pagesSoFar = 0;
  perLevel.forEach((pages, l) => {
    pagesSoFar += pages;
    if (pagesSoFar * PAGE <= 1e9) cachedLevels = l + 1;
  });
  const widest = Math.log10(perLevel[levels - 1] + 1);

  const sliders = [
    { label: "Rows in the table", value: compact(rows), min: 3, max: 10, step: 0.1, pos: Math.log10(rows), set: (v: number) => setRows(Math.round(10 ** v)) },
    { label: "Keys per index page", value: String(fanout), min: 10, max: 1000, step: 10, pos: fanout, set: setFanout },
    { label: "Bytes per row", value: `${rowBytes} B`, min: 50, max: 4000, step: 50, pos: rowBytes, set: setRowBytes },
  ];

  return (
    <div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
        {sliders.map((s) => (
          <label key={s.label} className="block">
            <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
              {s.label}
              <span className="font-mono text-[0.82rem] text-ink tabular-nums">{s.value}</span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.pos}
              onChange={(e) => s.set(Number(e.target.value))}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 grid gap-6">
        <div>
          <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">The index, level by level</p>
          <div className="mt-3 space-y-1.5" aria-label={`A B-tree ${levels} levels deep`}>
            {perLevel.map((pages, l) => {
              const width = Math.max(4, widest ? (Math.log10(pages + 1) / widest) * 100 : 4);
              return (
                <div key={l} className="grid grid-cols-[3.5rem_1fr_6rem] items-center gap-3 text-[0.78rem]">
                  <span className="text-ink-2">{l === 0 ? "Root" : l === levels - 1 ? "Leaves" : `Level ${l + 1}`}</span>
                  <span className="flex h-4 justify-center">
                    <span className={`block h-full ${l < cachedLevels ? "bg-accent/40" : "bg-accent"}`} style={{ width: `${Math.round(width)}%` }} />
                  </span>
                  <span className="font-mono text-[0.7rem] text-muted tabular-nums">{compact(pages)} {pages === 1 ? "page" : "pages"}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-[0.68rem] text-muted">Pale levels fit in 1 GB of memory and are usually cached.</p>
        </div>

        <div className="grid grid-cols-2 border border-line">
          <div className="p-4">
            <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Find one row by index</p>
            <p className="mt-1 font-serif text-[2rem] leading-none text-ink">{indexReads}</p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted">page reads · ~{time(lookupUs)}</p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted">{Math.max(1, indexReads - cachedLevels)} from disk, the rest cached</p>
          </div>
          <div className="border-l border-line p-4">
            <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Find it by full scan</p>
            <p className="mt-1 font-serif text-[2rem] leading-none text-ink">{compact(tablePages)}</p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted">page reads · ~{time(scanUs)}</p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted">{bytes(tablePages * PAGE)} read</p>
          </div>
        </div>
      </div>
    </div>
  );
}
