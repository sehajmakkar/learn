"use client";

// Fan-out and the tail: if a request waits for N servers and each is slow now and then, how often is the
// whole request slow? Assumes servers are slow independently of each other.
import { useState } from "react";

const pct = (x: number) => (x >= 0.995 ? ">99%" : x < 0.001 ? `${(x * 100).toFixed(2)}%` : `${+(x * 100).toPrecision(3)}%`);

export function TailLatencyLab({ preset }: { preset?: { fanout?: number; slow?: number } }) {
  const [fanout, setFanout] = useState(preset?.fanout ?? 100);
  const [slow, setSlow] = useState(preset?.slow ?? 0.01);
  const [hedge, setHedge] = useState(false);

  // With a hedged copy, a server's answer is slow only if both copies are slow.
  const perServer = hedge ? slow * slow : slow;
  const whole = 1 - (1 - perServer) ** fanout;
  const curve = Array.from({ length: 61 }, (_, i) => {
    const n = Math.round(10 ** ((i / 60) * Math.log10(1000)));
    return { n, p: 1 - (1 - perServer) ** n };
  });
  // Rounded so the server and browser render identical numbers (their float maths can differ in the last digits).
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const x = (n: number) => r2((Math.log10(n) / 3) * 100);
  const y = (p: number) => r2(50 - p * 50);

  return (
    <div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            Servers each request waits for
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">{fanout}</span>
          </span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.01}
            value={Math.log10(fanout)}
            onChange={(e) => setFanout(Math.round(10 ** Number(e.target.value)))}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
        </label>
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            Chance one server is slow
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">{pct(slow)}</span>
          </span>
          <input
            type="range"
            min={-4}
            max={-1}
            step={0.05}
            value={Math.log10(slow)}
            onChange={(e) => setSlow(+(10 ** Number(e.target.value)).toPrecision(2))}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-[0.85rem] text-ink-2">
        <input type="checkbox" checked={hedge} onChange={(e) => setHedge(e.target.checked)} className="size-4 accent-[var(--accent)]" />
        Hedge: send a second copy of slow calls to another server, use whichever answers first
      </label>

      <div className="mt-6 grid gap-6 sm:grid-cols-[12rem_1fr] sm:items-center">
        <div className="border border-line p-4">
          <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Whole requests that are slow</p>
          <p className="mt-1 font-serif text-[2.4rem] leading-none text-ink">{pct(whole)}</p>
          <p className="mt-1 font-mono text-[0.7rem] text-muted">1 − (1 − {hedge ? `${pct(slow)}²` : pct(slow)})^{fanout}</p>
        </div>
        <svg viewBox="0 0 100 50" className="h-40 w-full overflow-visible" role="img" aria-label="Share of slow requests as fan-out grows">
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-line" strokeWidth="0.3" />
          <line x1="0" y1="0" x2="100" y2="0" className="stroke-line" strokeWidth="0.3" strokeDasharray="1 1" />
          <polyline
            fill="none"
            className="stroke-accent"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
            points={curve.map((c) => `${x(c.n)},${y(c.p)}`).join(" ")}
          />
          <circle cx={x(fanout)} cy={y(whole)} r="1.4" className="fill-accent" />
          {[1, 10, 100, 1000].map((n) => (
            <text key={n} x={x(n)} y="56" textAnchor="middle" className="fill-muted font-mono" fontSize="3">
              {n}
            </text>
          ))}
          <text x="0" y="-2" className="fill-muted font-mono" fontSize="3">
            100% slow
          </text>
        </svg>
      </div>
    </div>
  );
}
