"use client";

// Eight fetcher threads crawl the same 600-URL frontier for 60 seconds under three scheduling policies.
// Politeness rule: after a fetch from a host finishes, wait D seconds before contacting that host again.
// Everything is seeded, so the server and the browser draw the same picture.
import { useState } from "react";

type Mix = "mixed" | "big" | "mostly";
type Policy = "fifo" | "fifo-wait" | "per-host";
type Url = { host: number; dur: number }; // host 0 is the big site
type Fetch = { worker: number; start: number; end: number; host: number; rude: boolean };

const WORKERS = 8;
const SPAN = 60;
const URLS = 600;
const SMALL_HOSTS = 30;

function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHARE: Record<Mix, number> = { mixed: 0.1, big: 0.4, mostly: 0.7 };

/** A breadth-first frontier has runs of URLs from the same host, because pages link to their own site. */
function frontier(mix: Mix): Url[] {
  const rand = prng(15_06);
  const out: Url[] = [];
  while (out.length < URLS) {
    const host = rand() < SHARE[mix] ? 0 : 1 + Math.floor(rand() * SMALL_HOSTS);
    const run = 1 + Math.floor(rand() * 6);
    for (let i = 0; i < run && out.length < URLS; i++) out.push({ host, dur: 0.4 + rand() * 0.8 });
  }
  return out;
}

function simulate(urls: Url[], policy: Policy, delay: number) {
  const free = new Array(WORKERS).fill(0); // when each worker is next idle
  const nextOk = new Map<number, number>(); // host -> earliest polite start
  const fetches: Fetch[] = [];
  let waiting = 0;
  let next = 0;
  const queues = new Map<number, Url[]>();
  if (policy === "per-host") for (const u of urls) queues.set(u.host, [...(queues.get(u.host) ?? []), u]);

  for (;;) {
    const w = free.indexOf(Math.min(...free));
    const t = free[w];
    if (t >= SPAN) break;
    let url: Url | undefined;
    let start = t;
    if (policy === "per-host") {
      // Mercator's back end: take the host that may be contacted soonest.
      let best = -1;
      for (const [h, q] of queues) if (q.length && (best < 0 || (nextOk.get(h) ?? 0) < (nextOk.get(best) ?? 0))) best = h;
      if (best < 0) break;
      url = queues.get(best)!.shift();
      start = Math.max(t, nextOk.get(best) ?? 0);
    } else {
      if (next >= urls.length) break;
      url = urls[next++];
      if (policy === "fifo-wait") start = Math.max(t, nextOk.get(url.host) ?? 0); // the thread blocks on its host
    }
    const u = url!;
    const rude = start < (nextOk.get(u.host) ?? 0) - 1e-9;
    const end = start + u.dur;
    waiting += Math.min(start, SPAN) - t;
    nextOk.set(u.host, Math.max(nextOk.get(u.host) ?? 0, end + delay));
    fetches.push({ worker: w, start, end, host: u.host, rude });
    free[w] = end;
  }

  const done = fetches.filter((f) => f.end <= SPAN);
  let mostAtOnce = 0;
  for (const f of fetches) {
    const overlap = fetches.filter((g) => g.host === f.host && g.start <= f.start && g.end > f.start).length;
    mostAtOnce = Math.max(mostAtOnce, overlap);
  }
  return {
    fetches,
    pages: done.length,
    big: done.filter((f) => f.host === 0).length,
    rude: fetches.filter((f) => f.rude && f.start < SPAN).length,
    mostAtOnce,
    idle: Math.round((waiting / (WORKERS * SPAN)) * 100),
  };
}

const POLICIES: [Policy, string][] = [
  ["fifo", "One FIFO queue, no politeness"],
  ["fifo-wait", "One FIFO queue, thread waits for its host"],
  ["per-host", "A queue per host, soonest-ready host first"],
];

const MIXES: [Mix, string, string][] = [
  ["mixed", "Many small sites", "10% of URLs are from one big site; the rest from 30 small ones."],
  ["big", "One big site", "40% of URLs are from one big site, in runs of up to six."],
  ["mostly", "Mostly one site", "70% of URLs are from one big site."],
];

const W = 600;
const LANE = 6;
const GAP = 2;
const H = WORKERS * (LANE + GAP);
const r1 = (n: number) => Math.round(n * 10) / 10;
const x = (t: number) => r1((Math.min(t, SPAN) / SPAN) * W);

export function CrawlerLab() {
  const [mix, setMix] = useState<Mix>("big");
  const [delay, setDelay] = useState(2);
  const urls = frontier(mix);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Frontier">
        {MIXES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mix === id}
            onClick={() => setMix(id)}
            className={`border px-2.5 py-1 font-mono text-[0.75rem] ${mix === id ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:border-ink-2"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.82rem] text-muted">{MIXES.find((m) => m[0] === mix)![2]}</p>

      <label className="mt-4 block max-w-sm">
        <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
          Politeness delay
          <span className="font-mono text-[0.82rem] text-ink tabular-nums">wait {delay} s per host</span>
        </span>
        <input type="range" min={1} max={5} step={1} value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--accent)]" />
      </label>

      <div className="mt-5 space-y-4">
        {POLICIES.map(([id, name]) => {
          const r = simulate(urls, id, delay);
          return (
            <div key={id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-[0.8rem]">
                <span className="font-mono text-ink-2">{name}</span>
                <span className="font-mono text-[0.72rem] tabular-nums text-muted">
                  {r.pages} pages ({r.big} from the big site) · threads idle {r.idle}% ·{" "}
                  <span className={r.rude ? "text-[var(--danger)]" : ""}>
                    {r.rude ? `${r.rude} rude requests, up to ${r.mostAtOnce} at once` : "polite"}
                  </span>
                </span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full" role="img" aria-label={`${name}: ${r.pages} pages in 60 seconds, ${r.rude} rude requests`}>
                <rect width={W} height={H} fill="var(--paper-2)" />
                {r.fetches
                  .filter((f) => f.start < SPAN)
                  .map((f, i) => (
                    <rect
                      key={i}
                      x={x(f.start)}
                      y={f.worker * (LANE + GAP) + 1}
                      width={Math.max(0.8, r1(x(f.end) - x(f.start) - 0.6))}
                      height={LANE}
                      fill={f.rude ? "var(--danger)" : f.host === 0 ? "var(--accent)" : "var(--muted)"}
                      opacity={f.host === 0 || f.rude ? 1 : 0.45}
                    />
                  ))}
              </svg>
            </div>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[0.68rem] text-muted">
        0 to 60 seconds, one lane per thread. Green: the big site. Grey: small sites. Red: a request that broke the
        politeness rule. Blank: a thread waiting.
      </p>
    </div>
  );
}
