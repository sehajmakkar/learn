"use client";

// Counting unique visitors with a HyperLogLog sketch. Visitors are numbered IDs, so the true count is known and the
// estimate can be checked. Everything is computed from (visitors, precision), so the same settings give the same picture.
import { useState } from "react";

function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function sketch(p: number, from: number, to: number, into?: Uint8Array) {
  const m = 1 << p;
  const reg = into ?? new Uint8Array(m);
  for (let i = from; i < to; i++) {
    const h = hash32(`visitor-${i}`);
    const idx = h >>> (32 - p);
    const rest = (h << p) >>> 0;
    const rank = rest === 0 ? 32 - p + 1 : Math.clz32(rest) + 1;
    if (rank > reg[idx]) reg[idx] = rank;
  }
  return reg;
}

function estimate(reg: Uint8Array) {
  const m = reg.length;
  let sum = 0;
  let zeros = 0;
  for (const r of reg) {
    sum += 2 ** -r;
    if (r === 0) zeros++;
  }
  const raw = ((0.7213 / (1 + 1.079 / m)) * m * m) / sum;
  return raw <= 2.5 * m && zeros > 0 ? m * Math.log(m / zeros) : raw;
}

const MAX = 2_000_000;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const bytes = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : b >= 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`);

export function HyperLogLogLab() {
  const [n, setN] = useState(0);
  const [p, setP] = useState(10);
  const [merge, setMerge] = useState(false);
  const [note, setNote] = useState("");

  const reg = sketch(p, 0, n);
  // "Yesterday": visitors n/2 .. 1.5n, half of them the same people as today.
  if (merge && n > 0) sketch(p, Math.floor(n / 2), Math.floor(n / 2) + n, reg);
  const trueCount = merge && n > 0 ? Math.floor(n / 2) + n : n;
  const est = n === 0 ? 0 : estimate(reg);
  const err = trueCount ? (est - trueCount) / trueCount : 0;
  const m = 1 << p;
  const shown = Math.min(m, 256);
  const add = (k: number) => {
    setN(Math.min(MAX, n + k));
    setNote("");
  };
  const btn = "border border-line px-2.5 py-1 font-mono text-[0.75rem] text-ink-2 hover:border-ink-2 disabled:opacity-40";

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {[1_000, 10_000, 100_000, 1_000_000].map((k) => (
          <button key={k} type="button" className={btn} disabled={n >= MAX} onClick={() => add(k)}>
            + {fmt(k)} visitors
          </button>
        ))}
        <button type="button" className={btn} disabled={n === 0} onClick={() => setNote(`Added all ${fmt(n)} visitors again. Every register already held at least as high a value, so nothing changed.`)}>
          Same visitors again
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setN(0);
            setNote("");
          }}
        >
          Start over
        </button>
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            Precision p ({fmt(m)} registers)
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">{p}</span>
          </span>
          <input type="range" min={4} max={16} step={1} value={p} onChange={(e) => {
              setP(Number(e.target.value));
              setNote("");
            }} className="mt-1.5 w-full accent-[var(--accent)]" />
        </label>
        <label className="flex items-center gap-2 self-end text-[0.85rem] text-ink-2">
          <input type="checkbox" checked={merge} onChange={(e) => {
              setMerge(e.target.checked);
              setNote("");
            }} className="accent-[var(--accent)]" />
          Merge with yesterday&apos;s sketch (half the same visitors)
        </label>
      </div>

      <div className="mt-5 grid grid-cols-2 border border-line sm:grid-cols-4">
        {[
          ["True unique visitors", fmt(trueCount)],
          ["HyperLogLog estimate", fmt(est)],
          ["Error", n ? `${(err * 100).toFixed(2)}%` : "–"],
          ["Expected error", `±${((1.04 / Math.sqrt(m)) * 100).toFixed(2)}%`],
        ].map(([k, v], i) => (
          <div key={k} className={`p-3 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
            <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">{k}</p>
            <p className="mt-1 font-serif text-[1.4rem] leading-none text-ink tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[0.82rem] text-muted">
        Sketch size: {bytes(Math.ceil((m * 6) / 8))} (6 bits per register). An exact set of {fmt(trueCount)} visitor IDs at 16 bytes each:{" "}
        {bytes(trueCount * 16)}.
      </p>
      {note && <p className="mt-2 text-[0.82rem] text-ink">{note}</p>}

      <div className="mt-4">
        <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">
          {shown === m ? "All" : `First ${shown} of ${fmt(m)}`} registers: darker = longer run of leading zeros seen
        </p>
        <div className="mt-2 grid grid-cols-[repeat(32,minmax(0,1fr))] gap-px" aria-hidden>
          {Array.from(reg.slice(0, shown)).map((r, i) => (
            <span key={i} className="aspect-square" style={{ background: r === 0 ? "var(--paper-2)" : `hsl(210 48% ${Math.max(18, 82 - r * 4)}%)` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
