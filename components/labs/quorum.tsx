"use client";

// Quorums: N replicas, a write that waits for W acknowledgements, a read that asks R replicas. Click a replica to take
// it down. The read shown is the worst case: the R reachable replicas least likely to have the new value.
import { useState } from "react";

type State = { n: number; w: number; r: number; down: number[]; has: number[] | null; writeError: string | null };

const start = (n: number, w: number, r: number): State => ({ n, w, r, down: [], has: null, writeError: null });

export function QuorumLab({ preset }: { preset?: { n?: number; w?: number; r?: number } }) {
  const [s, setS] = useState<State>(() => start(preset?.n ?? 5, preset?.w ?? 3, preset?.r ?? 3));
  const up = Array.from({ length: s.n }, (_, i) => i).filter((i) => !s.down.includes(i));

  const setN = (n: number) => setS(start(n, Math.min(s.w, n), Math.min(s.r, n)));
  const setW = (w: number) => setS({ ...s, w, has: null, writeError: null });
  const setR = (r: number) => setS({ ...s, r });
  const toggle = (i: number) => setS({ ...s, down: s.down.includes(i) ? s.down.filter((d) => d !== i) : [...s.down, i] });

  const write = () => {
    if (up.length < s.w) {
      setS({ ...s, has: null, writeError: `Write fails: ${up.length} replica${up.length === 1 ? " is" : "s are"} up, and W is ${s.w}.` });
      return;
    }
    // The write is acknowledged once W replicas have it; the rest haven't received it yet.
    setS({ ...s, has: up.slice(0, s.w), writeError: null });
  };

  // Worst-case read: prefer replicas without the new value.
  const readSet = [...up].sort((a, b) => Number(s.has?.includes(a) ?? false) - Number(s.has?.includes(b) ?? false)).slice(0, s.r);
  const readFails = up.length < s.r;
  const readSeesNew = !!s.has && readSet.some((i) => s.has!.includes(i));
  const overlap = s.r + s.w > s.n;

  const slider = (label: string, value: number, min: number, max: number, on: (v: number) => void) => (
    <label className="block">
      <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
        {label}
        <span className="font-mono text-[0.82rem] text-ink tabular-nums">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => on(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--accent)]" />
    </label>
  );
  const btn = "border border-line px-2.5 py-1 font-mono text-[0.75rem] text-ink-2 hover:border-ink-2";

  return (
    <div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
        {slider("Replicas (N)", s.n, 3, 7, setN)}
        {slider("Write waits for (W)", s.w, 1, s.n, setW)}
        {slider("Read asks (R)", s.r, 1, s.n, setR)}
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Replicas; click to take one down or bring it back">
        {Array.from({ length: s.n }, (_, i) => {
          const isDown = s.down.includes(i);
          const isNew = s.has?.includes(i);
          const inRead = !readFails && !!s.has && readSet.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={isDown}
              aria-label={`Replica ${i + 1}: ${isDown ? "down" : isNew ? "has v2" : "has v1"}`}
              className={`relative flex h-16 w-16 flex-col items-center justify-center border font-mono text-[0.72rem] ${
                isDown ? "border-dashed border-[var(--danger)] text-[var(--danger)]" : isNew ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2"
              } ${inRead ? "outline-2 outline-offset-2 outline-ink" : ""}`}
            >
              <span>R{i + 1}</span>
              <span className="text-[0.68rem]">{isDown ? "down" : isNew ? "v2" : "v1"}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[0.68rem] text-muted">
        Click a replica to take it down. Outlined: the replicas the worst-case read asks.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={write}>
          Write v2
        </button>
        <button type="button" className={btn} onClick={() => setS(start(s.n, s.w, s.r))}>
          Start over
        </button>
      </div>

      <div className="mt-5 grid border border-line sm:grid-cols-3">
        <div className="p-3">
          <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">R + W vs N</p>
          <p className="mt-1 font-serif text-[1.4rem] leading-tight text-ink">
            {s.r} + {s.w} {overlap ? ">" : "≤"} {s.n}
          </p>
          <p className="mt-1 text-[0.78rem] text-muted">{overlap ? "Every read set overlaps every write set." : "A read can miss every replica that has the write."}</p>
        </div>
        <div className="border-t border-line p-3 sm:border-t-0 sm:border-l">
          <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Write</p>
          <p className={`mt-1 text-[0.9rem] ${s.writeError ? "text-[var(--danger)]" : "text-ink"}`}>
            {s.writeError ?? (s.has ? `Acknowledged by ${s.w}: R${s.has.map((i) => i + 1).join(", R")}.` : "Not written yet.")}
          </p>
          <p className="mt-1 text-[0.78rem] text-muted">Survives {s.n - s.w} replica{s.n - s.w === 1 ? "" : "s"} down.</p>
        </div>
        <div className="border-t border-line p-3 sm:border-t-0 sm:border-l">
          <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Worst-case read</p>
          <p className={`mt-1 text-[0.9rem] ${readFails || (s.has && !readSeesNew) ? "text-[var(--danger)]" : "text-ink"}`}>
            {readFails
              ? `Fails: ${up.length} up, R is ${s.r}.`
              : !s.has
                ? "Write v2 first."
                : readSeesNew
                  ? "Returns v2, the latest."
                  : "Returns v1: stale."}
          </p>
          <p className="mt-1 text-[0.78rem] text-muted">Survives {s.n - s.r} replica{s.n - s.r === 1 ? "" : "s"} down.</p>
        </div>
      </div>
    </div>
  );
}
