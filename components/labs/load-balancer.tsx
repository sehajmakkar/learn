"use client";

// Load balancing algorithms, simulated: requests arrive at random, four servers work through their queues one
// request at a time, and the algorithm decides where each request goes. Everything is seeded, so the same
// settings always give the same result.
import { useState } from "react";

type Algo = "round-robin" | "random" | "least-conn" | "two-choices";
type Settings = { algo: Algo; load: number; slow: boolean; mixed: boolean };

const ALGOS: { id: Algo; label: string; note: string }[] = [
  { id: "round-robin", label: "Round robin", note: "Next server in turn, whatever it's doing." },
  { id: "random", label: "Random", note: "Any server, picked at random." },
  { id: "least-conn", label: "Least connections", note: "The server with the fewest requests in progress." },
  { id: "two-choices", label: "Two random choices", note: "Pick two at random, send to the less busy one." },
];

const SERVERS = 4;
const REQUESTS = 6000;
const MEAN_COST = 10; // ms of work at full speed

/** Small seeded random number generator (mulberry32), so results don't change between renders. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Result = { p50: number; p99: number; share: number[]; maxQueue: number[] };

function simulate({ algo, load, slow, mixed }: Settings): Result {
  const speed = Array.from({ length: SERVERS }, (_, i) => (slow && i === SERVERS - 1 ? 0.5 : 1));
  const capacity = speed.reduce((a, b) => a + b, 0) / MEAN_COST; // requests per ms the fleet can do
  const rate = load * capacity;
  const arrivals = rng(7);
  const costs = rng(11);
  const picks = rng(13);

  const freeAt = new Array<number>(SERVERS).fill(0);
  const finishes: number[][] = Array.from({ length: SERVERS }, () => []);
  const head = new Array<number>(SERVERS).fill(0);
  const share = new Array<number>(SERVERS).fill(0);
  const maxQueue = new Array<number>(SERVERS).fill(0);
  const latency: number[] = [];
  let t = 0;
  let next = 0;

  const open = (s: number) => {
    while (head[s] < finishes[s].length && finishes[s][head[s]] <= t) head[s]++;
    return finishes[s].length - head[s];
  };

  for (let i = 0; i < REQUESTS; i++) {
    t += -Math.log(1 - arrivals()) / rate;
    // Mixed traffic: most requests are cheap, one in ten does ten times the work. Same average.
    const cost = mixed ? (costs() < 0.1 ? MEAN_COST * 5.5 : MEAN_COST * 0.5) : MEAN_COST * (0.5 + costs());

    let s: number;
    if (algo === "round-robin") s = next++ % SERVERS;
    else if (algo === "random") s = Math.floor(picks() * SERVERS);
    else if (algo === "least-conn") {
      s = 0;
      for (let k = 1; k < SERVERS; k++) if (open(k) < open(s)) s = k;
    } else {
      const a = Math.floor(picks() * SERVERS);
      const b = (a + 1 + Math.floor(picks() * (SERVERS - 1))) % SERVERS;
      s = open(b) < open(a) ? b : a;
    }

    const start = Math.max(t, freeAt[s]);
    const done = start + cost / speed[s];
    freeAt[s] = done;
    finishes[s].push(done);
    share[s]++;
    maxQueue[s] = Math.max(maxQueue[s], open(s));
    latency.push(done - t);
  }

  latency.sort((a, b) => a - b);
  const at = (q: number) => latency[Math.min(latency.length - 1, Math.floor(q * latency.length))];
  return { p50: at(0.5), p99: at(0.99), share: share.map((n) => n / REQUESTS), maxQueue };
}

const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${Math.round(n)} ms`);

export function LoadBalancerLab() {
  const [s, setS] = useState<Settings>({ algo: "round-robin", load: 0.8, slow: false, mixed: false });
  const all = ALGOS.map((a) => ({ ...a, r: simulate({ ...s, algo: a.id }) }));
  const current = all.find((a) => a.id === s.algo)!;
  const worst = Math.max(...all.map((a) => a.r.p99));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Algorithm">
        {ALGOS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={s.algo === a.id}
            onClick={() => setS({ ...s, algo: a.id })}
            className={`h-8 border px-3 text-[0.82rem] transition-colors ${
              s.algo === a.id ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:text-ink"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.85rem] text-ink-2">{current.note}</p>

      <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            How busy the servers are
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">{Math.round(s.load * 100)}%</span>
          </span>
          <input
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={s.load}
            onChange={(e) => setS({ ...s, load: Number(e.target.value) })}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
        </label>
        <label className="flex items-center gap-2 text-[0.85rem] text-ink-2">
          <input type="checkbox" checked={s.mixed} onChange={(e) => setS({ ...s, mixed: e.target.checked })} className="size-4 accent-[var(--accent)]" />
          Some requests 10× heavier
        </label>
        <label className="flex items-center gap-2 text-[0.85rem] text-ink-2">
          <input type="checkbox" checked={s.slow} onChange={(e) => setS({ ...s, slow: e.target.checked })} className="size-4 accent-[var(--accent)]" />
          Server 4 at half speed
        </label>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Each server, with {current.label.toLowerCase()}</p>
          <div className="mt-3 space-y-2.5">
            {current.r.share.map((sh, i) => (
              <div key={i} className="grid grid-cols-[4.5rem_1fr_5.5rem] items-center gap-3 text-[0.8rem]">
                <span className="text-ink-2">
                  Server {i + 1}
                  {s.slow && i === SERVERS - 1 && <span className="text-muted"> ½</span>}
                </span>
                <span className="h-2.5 bg-paper-2">
                  <span className="block h-full bg-accent" style={{ width: `${Math.round(Math.min(100, sh * 200))}%` }} />
                </span>
                <span className="font-mono text-[0.72rem] text-muted tabular-nums">
                  {Math.round(sh * 100)}% · q{current.r.maxQueue[i]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[0.68rem] text-muted">Share of requests · longest queue seen</p>
        </div>

        <div>
          <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">p99 latency, same traffic</p>
          <div className="mt-3 space-y-2.5">
            {all.map((a) => (
              <div key={a.id} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 text-[0.8rem]">
                <span className={a.id === s.algo ? "text-ink" : "text-ink-2"}>{a.label}</span>
                <span className="h-2.5 bg-paper-2">
                  <span
                    className={`block h-full ${a.id === s.algo ? "bg-accent" : "bg-muted/50"}`}
                    style={{ width: `${Math.round((a.r.p99 / worst) * 100)}%` }}
                  />
                </span>
                <span className="text-right font-mono text-[0.72rem] text-ink tabular-nums">{ms(a.r.p99)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[0.68rem] text-muted">
            p50 with {current.label.toLowerCase()}: {ms(current.r.p50)} · each request is ~{MEAN_COST} ms of work
          </p>
        </div>
      </div>
    </div>
  );
}
