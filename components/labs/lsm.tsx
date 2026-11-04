"use client";

// An LSM tree, small enough to watch. Writes go to an in-memory table; when it holds four keys it's flushed to disk
// as a new sorted file. Reads check the memtable, then files newest first. Compaction merges the files into one.
import { useState } from "react";

type Value = string | null; // null: a tombstone (the key was deleted)
type Run = { id: number; entries: [string, Value][] };
type State = { step: number; memtable: [string, Value][]; runs: Run[]; nextId: number; written: number; userWrites: number; log: string[] };

const KEYS = ["x7Kp", "b2Qe", "m4Zt", "q9Lw", "r3Hd", "t8Ns"];
const LIMIT = 4;

/** The workload: the next write in a fixed script, so everyone sees the same tree. Every 7th write is a delete. */
const op = (i: number): [string, Value] => [KEYS[(i * 5) % KEYS.length], i % 7 === 6 ? null : `v${i + 1}`];

const fresh = (): State => ({ step: 0, memtable: [], runs: [], nextId: 1, written: 0, userWrites: 0, log: [] });
const sortEntries = (e: [string, Value][]) => [...e].sort(([a], [b]) => (a < b ? -1 : 1));

function flush(s: State): State {
  if (s.memtable.length === 0) return s;
  const run = { id: s.nextId, entries: sortEntries(s.memtable) };
  return {
    ...s,
    memtable: [],
    runs: [run, ...s.runs],
    nextId: s.nextId + 1,
    written: s.written + run.entries.length,
    log: [...s.log, `Flushed the memtable to file ${run.id} (${run.entries.length} keys, sorted).`],
  };
}

function write(s: State): State {
  const [key, value] = op(s.step);
  const memtable = [...s.memtable.filter(([k]) => k !== key), [key, value] as [string, Value]];
  let next: State = {
    ...s,
    step: s.step + 1,
    memtable,
    userWrites: s.userWrites + 1,
    log: [...s.log, value === null ? `Delete ${key}: a tombstone goes in the memtable.` : `Set ${key} = ${value} in the memtable.`],
  };
  if (memtable.length >= LIMIT) next = flush(next);
  return next;
}

function compact(s: State): State {
  if (s.runs.length < 2) return s;
  const merged = new Map<string, Value>();
  for (const run of [...s.runs].reverse()) for (const [k, v] of run.entries) merged.set(k, v); // newer files win
  const dropped = [...merged].filter(([, v]) => v === null).length;
  const entries = sortEntries([...merged].filter(([, v]) => v !== null));
  const run = { id: s.nextId, entries };
  return {
    ...s,
    runs: [run],
    nextId: s.nextId + 1,
    written: s.written + entries.length,
    log: [...s.log, `Compacted ${s.runs.length} files into file ${run.id}: ${entries.length} live keys, ${dropped} tombstone${dropped === 1 ? "" : "s"} dropped.`],
  };
}

function read(s: State, key: string, bloom: boolean) {
  const mem = s.memtable.find(([k]) => k === key);
  if (mem) return { value: mem[1], searched: 0, skipped: 0, where: "memtable" };
  let searched = 0;
  let skipped = 0;
  for (const run of s.runs) {
    const hit = run.entries.find(([k]) => k === key);
    if (bloom && !hit) {
      skipped++; // the file's Bloom filter says "definitely not here"
      continue;
    }
    searched++;
    if (hit) return { value: hit[1], searched, skipped, where: `file ${run.id}` };
  }
  return { value: null, searched, skipped, where: null };
}

export function LsmLab() {
  const [s, setS] = useState<State>(fresh);
  const [bloom, setBloom] = useState(false);
  const [readKey, setReadKey] = useState<string | null>(null);
  const r = readKey ? read(s, readKey, bloom) : null;
  const btn = "border border-line px-2.5 py-1 font-mono text-[0.75rem] text-ink-2 hover:border-ink-2 disabled:opacity-40";
  const cell = (k: string, v: Value, hot: boolean) => (
    <span
      key={k}
      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[0.7rem] ${hot ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2"} ${v === null ? "line-through decoration-[var(--danger)]" : ""}`}
    >
      {k}
      <span className="text-muted">{v ?? "✕"}</span>
    </span>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => setS(write(s))}>
          Write next ({op(s.step)[1] === null ? `delete ${op(s.step)[0]}` : `${op(s.step)[0]} = ${op(s.step)[1]}`})
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            let t = s;
            for (let i = 0; i < 8; i++) t = write(t);
            setS(t);
          }}
        >
          Write 8
        </button>
        <button type="button" className={btn} disabled={s.memtable.length === 0} onClick={() => setS(flush(s))}>
          Flush
        </button>
        <button type="button" className={btn} disabled={s.runs.length < 2} onClick={() => setS(compact(s))}>
          Compact
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setS(fresh());
            setReadKey(null);
          }}
        >
          Start over
        </button>
      </div>

      <div className="mt-5 border border-line p-3">
        <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Memtable (in memory, flushed at {LIMIT} keys)</p>
        <div className="mt-2 flex min-h-7 flex-wrap gap-1.5">{s.memtable.length ? s.memtable.map(([k, v]) => cell(k, v, r?.where === "memtable" && k === readKey)) : <span className="text-[0.8rem] text-muted">empty</span>}</div>
      </div>
      <div className="mt-2 space-y-2">
        {s.runs.length === 0 && <p className="text-[0.8rem] text-muted">No files on disk yet.</p>}
        {s.runs.map((run, i) => (
          <div key={run.id} className="border border-line p-3">
            <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">
              File {run.id} on disk{i === 0 ? " (newest)" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">{run.entries.map(([k, v]) => cell(k, v, r?.where === `file ${run.id}` && k === readKey))}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[0.85rem] text-ink-2">Read</span>
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => setReadKey(k)} className={`${btn} ${readKey === k ? "border-accent text-accent-ink" : ""}`}>
              {k}
            </button>
          ))}
          <label className="ml-2 flex items-center gap-1.5 text-[0.82rem] text-ink-2">
            <input type="checkbox" checked={bloom} onChange={(e) => setBloom(e.target.checked)} className="accent-[var(--accent)]" />
            Bloom filter per file
          </label>
        </div>
        {r && readKey && (
          <p className="mt-2 text-[0.85rem] text-ink">
            {readKey}: {r.where ? (r.value === null ? `deleted (tombstone in ${r.where})` : `${r.value}, from ${r.where}`) : "not found"}.{" "}
            <span className="text-muted">
              Files searched: {r.searched}
              {bloom ? `, skipped by Bloom filters: ${r.skipped}` : ""}.
            </span>
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 border border-line">
        {[
          ["Your writes", String(s.userWrites)],
          ["Keys written to disk", String(s.written)],
          ["Write amplification", s.userWrites ? `${(s.written / s.userWrites).toFixed(2)}×` : "–"],
        ].map(([k, v], i) => (
          <div key={k} className={`p-3 ${i ? "border-l border-line" : ""}`}>
            <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">{k}</p>
            <p className="mt-1 font-serif text-[1.5rem] leading-none text-ink">{v}</p>
          </div>
        ))}
      </div>

      {s.log.length > 0 && (
        <ol className="mt-4 max-h-36 space-y-0.5 overflow-y-auto border-t border-line pt-3 font-mono text-[0.7rem] text-muted">
          {s.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
