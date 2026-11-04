"use client";

// Eviction policies on a redirect workload. 60,000 requests for Snip codes, with popularity following a power law,
// replayed through FIFO, LRU, LFU and the optimal policy (which knows every future request). A fixed seed means the
// same settings always give the same numbers, on the server and in the browser.
import { useState } from "react";

type Pattern = "steady" | "shift" | "scan";
type Config = { pattern: Pattern; skew: number; size: number };

const KEYS = 20_000;
const REQS = 60_000;
const WINDOWS = 20;
const SIZES = [200, 500, 1000, 2000, 4000];
const SKEWS = [0.7, 0.9, 1.1];
const POLICIES = [
  { id: "fifo", label: "FIFO", hue: 45 },
  { id: "lru", label: "LRU", hue: 210 },
  { id: "lfu", label: "LFU", hue: 160 },
  { id: "opt", label: "Optimal", hue: 0 },
] as const;
const color = (hue: number) => (hue === 0 ? "var(--ink-2)" : `hsl(${hue} 48% 50%)`);

/** A small seeded random number generator (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The request stream: which code each of the 60,000 requests asks for. */
function workload(pattern: Pattern, skew: number): Int32Array {
  const random = rng(42);
  const cdf = new Float64Array(KEYS);
  let sum = 0;
  for (let i = 0; i < KEYS; i++) cdf[i] = sum += 1 / Math.pow(i + 1, skew);
  for (let i = 0; i < KEYS; i++) cdf[i] /= sum;
  const draw = () => {
    const x = random();
    let lo = 0;
    let hi = KEYS - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const out = new Int32Array(REQS);
  let scanned = KEYS; // codes the crawler asks for once, and nobody asks for again
  for (let i = 0; i < REQS; i++) {
    const rank = draw();
    if (pattern === "shift") {
      // Each quarter, a different set of links is popular: today's links replace yesterday's.
      out[i] = (rank + Math.floor((i * 4) / REQS) * 5000) % KEYS;
    } else if (pattern === "scan" && i >= REQS / 3 && i < (2 * REQS) / 3 && i % 2 === 0) {
      out[i] = scanned++;
    } else out[i] = rank;
  }
  return out;
}

function fifo(reqs: Int32Array, size: number) {
  const set = new Set<number>();
  const hits = new Uint8Array(reqs.length);
  reqs.forEach((k, i) => {
    if (set.has(k)) hits[i] = 1;
    else {
      if (set.size >= size) set.delete(set.values().next().value!);
      set.add(k);
    }
  });
  return hits;
}

function lru(reqs: Int32Array, size: number) {
  const map = new Map<number, true>(); // insertion order = least recently used first
  const hits = new Uint8Array(reqs.length);
  reqs.forEach((k, i) => {
    if (map.has(k)) {
      hits[i] = 1;
      map.delete(k);
    } else if (map.size >= size) map.delete(map.keys().next().value!);
    map.set(k, true);
  });
  return hits;
}

/** LFU in constant time per request: a bucket of keys per count; ties go to the least recently used. */
function lfu(reqs: Int32Array, size: number) {
  const count = new Map<number, number>();
  const buckets = new Map<number, Set<number>>();
  let min = 0;
  const hits = new Uint8Array(reqs.length);
  const place = (k: number, c: number) => {
    count.set(k, c);
    let b = buckets.get(c);
    if (!b) buckets.set(c, (b = new Set()));
    b.add(k);
  };
  const unplace = (k: number, c: number) => {
    const b = buckets.get(c)!;
    b.delete(k);
    if (b.size === 0) buckets.delete(c);
  };
  reqs.forEach((k, i) => {
    const c = count.get(k);
    if (c !== undefined) {
      hits[i] = 1;
      unplace(k, c);
      if (min === c && !buckets.has(c)) min = c + 1;
      place(k, c + 1);
      return;
    }
    if (count.size >= size) {
      const victim = buckets.get(min)!.values().next().value!;
      unplace(victim, min);
      count.delete(victim);
    }
    place(k, 1);
    min = 1;
  });
  return hits;
}

/** Belady's optimal policy: evict the key whose next request is furthest away. Needs the future, so it's a yardstick. */
function optimal(reqs: Int32Array, size: number) {
  const n = reqs.length;
  const next = new Int32Array(n);
  const last = new Map<number, number>();
  for (let i = n - 1; i >= 0; i--) {
    next[i] = last.get(reqs[i]) ?? n + i; // never again: further than any real request
    last.set(reqs[i], i);
  }
  const current = new Map<number, number>(); // key -> its next request
  const heap: [number, number][] = []; // max-heap on next request, stale entries skipped
  const push = (v: number, k: number) => {
    heap.push([v, k]);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p][0] >= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const end = heap.pop()!;
    if (heap.length) {
      heap[0] = end;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        let m = i;
        if (l < heap.length && heap[l][0] > heap[m][0]) m = l;
        if (l + 1 < heap.length && heap[l + 1][0] > heap[m][0]) m = l + 1;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const hits = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const k = reqs[i];
    if (current.has(k)) hits[i] = 1;
    else if (current.size >= size) {
      for (;;) {
        const [v, key] = pop();
        if (current.get(key) === v) {
          current.delete(key);
          break;
        }
      }
    }
    current.set(k, next[i]);
    push(next[i], k);
  }
  return hits;
}

const RUN = { fifo, lru, lfu, opt: optimal };

function simulate({ pattern, skew, size }: Config) {
  const reqs = workload(pattern, skew);
  return POLICIES.map((p) => {
    const hits = RUN[p.id](reqs, size);
    let total = 0;
    const windows = Array.from({ length: WINDOWS }, () => 0);
    const per = REQS / WINDOWS;
    hits.forEach((h, i) => {
      total += h;
      windows[Math.floor(i / per)] += h;
    });
    return { ...p, rate: total / REQS, windows: windows.map((w) => w / per) };
  });
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const pct = (n: number) => `${(Math.round(n * 1000) / 10).toFixed(1)}%`;

const PATTERNS: [Pattern, string, string][] = [
  ["steady", "Steady", "The same links stay popular throughout."],
  ["shift", "Popularity shifts", "Every quarter of the run, a new set of links becomes popular."],
  ["scan", "Crawler scan", "In the middle third, a crawler requests 10,000 old links once each."],
];

export function EvictionLab({ preset }: { preset?: Partial<Config> }) {
  const [cfg, setCfg] = useState<Config>({
    pattern: preset?.pattern ?? "steady",
    skew: preset?.skew ?? 0.9,
    size: preset?.size ?? 1000,
  });
  const results = simulate(cfg);
  const set = (next: Partial<Config>) => setCfg({ ...cfg, ...next });

  // Chart: hit rate in each window of 3,000 requests. x 0..300, y 0..120 (100% at the top).
  const x = (i: number) => r2((i / (WINDOWS - 1)) * 300);
  const y = (v: number) => r2(120 - v * 120);
  const marks =
    cfg.pattern === "shift" ? [5, 10, 15].map((w) => x(w - 0.5)) : cfg.pattern === "scan" ? [x(WINDOWS / 3 - 0.5), x((2 * WINDOWS) / 3 - 0.5)] : [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Workload">
        {PATTERNS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={cfg.pattern === id}
            onClick={() => set({ pattern: id })}
            className={`border px-2.5 py-1 font-mono text-[0.75rem] ${cfg.pattern === id ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:border-ink-2"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.82rem] text-muted">{PATTERNS.find((p) => p[0] === cfg.pattern)![2]}</p>

      <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            Cache size
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">
              {cfg.size.toLocaleString("en-US")} of {KEYS.toLocaleString("en-US")} links
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={SIZES.length - 1}
            step={1}
            value={SIZES.indexOf(cfg.size)}
            onChange={(e) => set({ size: SIZES[Number(e.target.value)] })}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
        </label>
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            How lopsided popularity is
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">{["gentle", "typical", "steep"][SKEWS.indexOf(cfg.skew)]}</span>
          </span>
          <input
            type="range"
            min={0}
            max={SKEWS.length - 1}
            step={1}
            value={SKEWS.indexOf(cfg.skew)}
            onChange={(e) => set({ skew: SKEWS[Number(e.target.value)] })}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
        </label>
      </div>

      <div className="mt-6 grid items-start gap-6 sm:grid-cols-[1fr_1fr]">
        <div className="space-y-2.5">
          {results.map((r) => (
            <div key={r.id} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3 text-[0.8rem]">
              <span className="font-mono text-ink-2">{r.label}</span>
              <span className="h-3 bg-paper-2">
                <span className="block h-full" style={{ width: `${Math.round(r.rate * 100)}%`, background: color(r.hue) }} />
              </span>
              <span className="text-right font-mono text-[0.75rem] text-ink tabular-nums">{pct(r.rate)}</span>
            </div>
          ))}
          <p className="pt-1 font-mono text-[0.68rem] text-muted">
            Hit rate over all {REQS.toLocaleString("en-US")} requests. Optimal knows every future request, so no real cache beats it.
          </p>
        </div>

        <figure>
          <svg viewBox="-28 -6 336 146" className="w-full" role="img" aria-label="Hit rate of each policy over the course of the run">
            {[0, 0.5, 1].map((v) => (
              <g key={v}>
                <line x1={0} x2={300} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={0.6} />
                <text x={-6} y={y(v) + 3} textAnchor="end" fontSize={8} fill="var(--muted)" fontFamily="var(--font-mono)">
                  {v * 100}%
                </text>
              </g>
            ))}
            {cfg.pattern === "scan" && marks.length === 2 && <rect x={marks[0]} y={0} width={r2(marks[1] - marks[0])} height={120} fill="var(--paper-2)" />}
            {cfg.pattern === "shift" && marks.map((m) => <line key={m} x1={m} x2={m} y1={0} y2={120} stroke="var(--muted)" strokeWidth={0.6} strokeDasharray="2 2" />)}
            {results.map((r) => (
              <polyline
                key={r.id}
                fill="none"
                stroke={color(r.hue)}
                strokeWidth={1.6}
                strokeDasharray={r.id === "opt" ? "3 2" : undefined}
                points={r.windows.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              />
            ))}
            <text x={0} y={136} fontSize={8} fill="var(--muted)" fontFamily="var(--font-mono)">
              start
            </text>
            <text x={300} y={136} textAnchor="end" fontSize={8} fill="var(--muted)" fontFamily="var(--font-mono)">
              end of run
            </text>
          </svg>
          <figcaption className="mt-1 font-mono text-[0.68rem] text-muted">
            Hit rate over time, per {(REQS / WINDOWS).toLocaleString("en-US")} requests.
            {cfg.pattern === "shift" && " Dashed lines: popularity shifts."}
            {cfg.pattern === "scan" && " Shaded: the crawler is scanning."}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
