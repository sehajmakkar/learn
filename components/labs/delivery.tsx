"use client";

// Crash the consumer: a worker reads click events in batches of three, adds them to a count, and saves its position.
// The order of "count" and "save position" decides whether a crash loses clicks, counts them twice, or neither.
import { useState } from "react";

type Strategy = "save-first" | "count-first" | "together";
type Phase = "read" | "count" | "save";

const TOTAL = 12;
const BATCH = 3;

const STRATEGIES: { id: Strategy; label: string; phases: Phase[]; note: string }[] = [
  { id: "save-first", label: "Save position, then count", phases: ["read", "save", "count"], note: "At most once: a crash between the two loses the batch." },
  { id: "count-first", label: "Count, then save position", phases: ["read", "count", "save"], note: "At least once: a crash between the two counts the batch again." },
  { id: "together", label: "Count and position in one transaction", phases: ["read", "count", "save"], note: "The database remembers which clicks it has counted, so a repeat is skipped." },
];

type State = {
  saved: number; // the broker's saved position: the next click to read after a restart
  dbOffset: number; // "together" only: the next click the database hasn't counted, stored with the counts
  counted: number[]; // how many times each click has been counted
  batch: [number, number] | null; // the batch the worker holds in memory
  phase: number; // index into the strategy's phases
  log: string[];
};

const fresh = (): State => ({ saved: 0, dbOffset: 0, counted: Array(TOTAL).fill(0), batch: null, phase: 0, log: [] });
const range = ([a, b]: [number, number]) => (b - a === 1 ? `click ${a + 1}` : `clicks ${a + 1}–${b}`);

function describe(s: State, strategy: Strategy): string {
  const phases = STRATEGIES.find((x) => x.id === strategy)!.phases;
  if (!s.batch) return s.saved >= TOTAL ? "All clicks processed." : `Read clicks ${s.saved + 1}–${Math.min(s.saved + BATCH, TOTAL)} from the saved position.`;
  const p = phases[s.phase];
  if (p === "save") return `Save position ${s.batch[1]} at the broker.`;
  if (strategy === "together") return `In one transaction: add ${range(s.batch)} to the count (skipping any already counted) and record ${s.batch[1]} as counted.`;
  return `Add ${range(s.batch)} to the count.`;
}

function step(s: State, strategy: Strategy): State {
  const phases = STRATEGIES.find((x) => x.id === strategy)!.phases;
  const next = { ...s, counted: [...s.counted], log: [...s.log] };
  if (!next.batch) {
    if (next.saved >= TOTAL) return s;
    next.batch = [next.saved, Math.min(next.saved + BATCH, TOTAL)];
    next.phase = 1;
    next.log.push(`Read ${range(next.batch)}.`);
    return next;
  }
  const [a, b] = next.batch;
  if (phases[next.phase] === "save") {
    next.saved = b;
    next.log.push(`Saved position ${b}.`);
  } else if (strategy === "together") {
    const from = Math.max(a, next.dbOffset);
    for (let i = from; i < b; i++) next.counted[i]++;
    next.dbOffset = Math.max(next.dbOffset, b);
    next.log.push(from >= b ? `Skipped ${range([a, b])}: already counted.` : `Counted ${range([from, b])} and recorded ${b} in the same transaction.`);
  } else {
    for (let i = a; i < b; i++) next.counted[i]++;
    next.log.push(`Counted ${range([a, b])}.`);
  }
  next.phase++;
  if (next.phase >= phases.length) {
    next.batch = null;
    next.phase = 0;
  }
  return next;
}

export function DeliveryLab({ preset }: { preset?: { strategy?: Strategy } }) {
  const [strategy, setStrategy] = useState<Strategy>(preset?.strategy ?? "count-first");
  const [s, setS] = useState<State>(fresh);
  const done = s.saved >= TOTAL && !s.batch;
  const total = s.counted.reduce((x, y) => x + y, 0);
  const lost = s.counted.filter((c, i) => c === 0 && i < s.saved && !(s.batch && i >= s.batch[0] && i < s.batch[1])).length;
  const twice = s.counted.filter((c) => c > 1).length;

  const choose = (id: Strategy) => {
    setStrategy(id);
    setS(fresh());
  };
  const crash = () =>
    setS({ ...s, batch: null, phase: 0, log: [...s.log, `Worker crashed. A new worker starts from saved position ${s.saved}.`] });
  const runAll = () => {
    let t = s;
    for (let i = 0; i < 100 && !(t.saved >= TOTAL && !t.batch); i++) t = step(t, strategy);
    setS(t);
  };

  const btn = "border border-line px-2.5 py-1 font-mono text-[0.75rem] text-ink-2 hover:border-ink-2 disabled:opacity-40";

  return (
    <div>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap" role="radiogroup" aria-label="Order of operations">
        {STRATEGIES.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={strategy === x.id}
            onClick={() => choose(x.id)}
            className={`border px-2.5 py-1 text-left font-mono text-[0.75rem] ${strategy === x.id ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:border-ink-2"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.82rem] text-muted">{STRATEGIES.find((x) => x.id === strategy)!.note}</p>

      <div className="mt-5 grid grid-cols-6 gap-1.5 sm:grid-cols-12" aria-label="Click events">
        {s.counted.map((c, i) => {
          const held = s.batch && i >= s.batch[0] && i < s.batch[1];
          const isLost = c === 0 && i < s.saved && !held;
          const cls =
            c > 1
              ? "border-[var(--danger)] bg-[var(--danger)] text-paper"
              : isLost
                ? "border-dashed border-[var(--danger)] text-[var(--danger)]"
                : c === 1
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line text-muted";
          return (
            <div key={i} className={`relative flex h-11 flex-col items-center justify-center border font-mono text-[0.7rem] ${cls} ${held ? "outline-2 outline-offset-2 outline-ink" : ""}`}>
              <span>{i + 1}</span>
              <span className="text-[0.6rem]">{c > 1 ? `×${c}` : isLost ? "lost" : c === 1 ? "✓" : ""}</span>
              {i === s.saved && <span className="absolute -bottom-3 text-[0.6rem] text-ink">▲</span>}
            </div>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[0.68rem] text-muted">▲ the broker&apos;s saved position. Outlined: the batch the worker holds in memory.</p>

      <div className="mt-4 grid grid-cols-3 border border-line">
        {[
          ["Count", `${total} of ${TOTAL}`],
          ["Lost", String(lost)],
          ["Counted twice", String(twice)],
        ].map(([k, v], i) => (
          <div key={k} className={`p-3 ${i ? "border-l border-line" : ""}`}>
            <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">{k}</p>
            <p className={`mt-1 font-serif text-[1.6rem] leading-none ${(k === "Lost" && lost) || (k === "Counted twice" && twice) ? "text-[var(--danger)]" : "text-ink"}`}>{v}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[0.85rem] text-ink-2">
        <span className="font-mono text-[0.7rem] text-muted uppercase">Next: </span>
        {describe(s, strategy)}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" className={btn} disabled={done} onClick={() => setS(step(s, strategy))}>
          Next step
        </button>
        <button type="button" className={`${btn} hover:border-[var(--danger)] hover:text-[var(--danger)]`} disabled={!s.batch} onClick={crash}>
          Crash the worker
        </button>
        <button type="button" className={btn} disabled={done} onClick={runAll}>
          Run to the end
        </button>
        <button type="button" className={btn} onClick={() => setS(fresh())}>
          Start over
        </button>
      </div>

      {s.log.length > 0 && (
        <ol className="mt-4 max-h-40 space-y-0.5 overflow-y-auto border-t border-line pt-3 font-mono text-[0.7rem] text-muted">
          {s.log.map((line, i) => (
            <li key={i} className={line.startsWith("Worker crashed") ? "text-[var(--danger)]" : ""}>
              {line}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
