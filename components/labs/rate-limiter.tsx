"use client";

// Four rate limiters on the same 30 seconds of requests. Each row shows which requests got through (filled) and
// which were rejected (red). The limit is N requests per 10 seconds; the token bucket holds N and refills N per 10 s.
import { useState } from "react";

type Pattern = "steady" | "boundary" | "bursty";
type Limiter = { allow(now: number): boolean };

class FixedWindow implements Limiter {
  private window = -1;
  private count = 0;
  constructor(private limit: number, private size: number) {}
  allow(now: number) {
    const w = Math.floor(now / this.size);
    if (w !== this.window) {
      this.window = w;
      this.count = 0;
    }
    if (this.count >= this.limit) return false;
    this.count++;
    return true;
  }
}

class SlidingLog implements Limiter {
  private times: number[] = [];
  constructor(private limit: number, private size: number) {}
  allow(now: number) {
    while (this.times.length && this.times[0] <= now - this.size) this.times.shift();
    if (this.times.length >= this.limit) return false;
    this.times.push(now);
    return true;
  }
}

class SlidingCounter implements Limiter {
  private window = -1;
  private current = 0;
  private previous = 0;
  constructor(private limit: number, private size: number) {}
  allow(now: number) {
    const w = Math.floor(now / this.size);
    if (w !== this.window) {
      this.previous = w === this.window + 1 ? this.current : 0;
      this.current = 0;
      this.window = w;
    }
    const estimate = this.previous * (1 - (now % this.size) / this.size) + this.current;
    if (estimate >= this.limit) return false;
    this.current++;
    return true;
  }
}

class TokenBucket implements Limiter {
  private tokens: number;
  private last = 0;
  constructor(private capacity: number, private perMs: number) {
    this.tokens = capacity;
  }
  allow(now: number) {
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * this.perMs);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

const SPAN = 30_000;
const WINDOW = 10_000;

function arrivals(p: Pattern): number[] {
  if (p === "steady") return Array.from({ length: 50 }, (_, i) => i * 600);
  if (p === "boundary")
    return [3000, 5500, ...Array.from({ length: 15 }, (_, i) => 8500 + i * 100), ...Array.from({ length: 15 }, (_, i) => 10_000 + i * 100), 20_500, 24_000, 27_500];
  return Array.from({ length: 7 }, (_, g) => Array.from({ length: 8 }, (_, i) => g * 4300 + 200 + i * 60)).flat();
}

const ROWS: [string, (n: number) => Limiter][] = [
  ["Fixed window", (n) => new FixedWindow(n, WINDOW)],
  ["Sliding log", (n) => new SlidingLog(n, WINDOW)],
  ["Sliding window counter", (n) => new SlidingCounter(n, WINDOW)],
  ["Token bucket", (n) => new TokenBucket(n, n / WINDOW)],
];

const PATTERNS: [Pattern, string, string][] = [
  ["steady", "Steady overload", "One request every 0.6 s: about 17 per 10 s, against the limit."],
  ["boundary", "Burst at a boundary", "15 requests just before 10 s and 15 just after, with a few others."],
  ["bursty", "Bursts", "Groups of 8 requests in half a second, every 4.3 s."],
];

/** The most requests allowed in any 10-second stretch. */
function worstWindow(times: number[]) {
  let best = 0;
  for (let i = 0, j = 0; j < times.length; j++) {
    while (times[j] - times[i] >= WINDOW) i++;
    best = Math.max(best, j - i + 1);
  }
  return best;
}

const W = 600;
const r1 = (n: number) => Math.round(n * 10) / 10;
const x = (t: number) => r1((t / SPAN) * W);

export function RateLimiterLab() {
  const [pattern, setPattern] = useState<Pattern>("boundary");
  const [limit, setLimit] = useState(10);
  const reqs = arrivals(pattern);
  const rows = ROWS.map(([name, make]) => {
    const lim = make(limit);
    const decisions = reqs.map((t) => ({ t, ok: lim.allow(t) }));
    const okTimes = decisions.filter((d) => d.ok).map((d) => d.t);
    return { name, decisions, allowed: okTimes.length, worst: worstWindow(okTimes) };
  });

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Traffic pattern">
        {PATTERNS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={pattern === id}
            onClick={() => setPattern(id)}
            className={`border px-2.5 py-1 font-mono text-[0.75rem] ${pattern === id ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:border-ink-2"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.82rem] text-muted">{PATTERNS.find((p) => p[0] === pattern)![2]}</p>

      <label className="mt-4 block max-w-sm">
        <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
          Limit
          <span className="font-mono text-[0.82rem] text-ink tabular-nums">{limit} requests per 10 s</span>
        </span>
        <input type="range" min={5} max={20} step={5} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--accent)]" />
      </label>

      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-[0.8rem]">
              <span className="font-mono text-ink-2">{r.name}</span>
              <span className="font-mono text-[0.72rem] tabular-nums text-muted">
                allowed {r.allowed} of {reqs.length} ·{" "}
                <span className={r.worst > limit ? "text-[var(--danger)]" : ""}>most in any 10 s: {r.worst}</span>
              </span>
            </div>
            <svg viewBox={`0 0 ${W} 22`} className="mt-1 w-full" role="img" aria-label={`${r.name}: ${r.allowed} of ${reqs.length} requests allowed`}>
              <rect width={W} height={22} fill="var(--paper-2)" />
              {[1, 2].map((k) => (
                <line key={k} x1={x(k * WINDOW)} x2={x(k * WINDOW)} y1={0} y2={22} stroke="var(--muted)" strokeWidth={0.8} strokeDasharray="2 2" />
              ))}
              {r.decisions.map((d, i) => (
                <rect key={i} x={x(d.t)} y={d.ok ? 4 : 13} width={2.2} height={d.ok ? 9 : 6} fill={d.ok ? "var(--accent)" : "var(--danger)"} />
              ))}
            </svg>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[0.68rem] text-muted">
        0 to 30 seconds. Dashed lines: fixed window boundaries. Tall bars: allowed. Short red bars: rejected.
      </p>
    </div>
  );
}
