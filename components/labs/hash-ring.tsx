"use client";

// Consistent hashing versus hash mod N. 10,000 keys are placed on servers; add or remove a server and count how many
// keys have to move. Everything is computed from fixed hashes, so the same settings always give the same picture.
import { useState } from "react";

type Mode = "ring" | "mod";
type Config = { mode: Mode; servers: number; vnodes: number };

const KEYS = 10_000;
const SHOWN = 360; // keys drawn as dots
const MAX_SERVERS = 8;
const VNODE_STEPS = [1, 3, 10, 50, 200];
const NAMES = "ABCDEFGH";
// Mid-lightness hues that read on both the light and dark paper. No reds: red marks keys that moved.
const HUES = [90, 210, 45, 275, 160, 320, 235, 185];
const color = (s: number) => `hsl(${HUES[s]} 48% 50%)`;

/** 32-bit FNV-1a, then a final mix so nearby strings land far apart. */
function hash(text: string) {
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

const KEY_HASHES = Array.from({ length: KEYS }, (_, i) => hash(`link-${i}`));
const SPACE = 2 ** 32;

type Token = { at: number; server: number };

function tokens(servers: number, vnodes: number): Token[] {
  const out: Token[] = [];
  for (let s = 0; s < servers; s++) for (let v = 0; v < vnodes; v++) out.push({ at: hash(`server-${NAMES[s]}#${v}`), server: s });
  return out.sort((a, b) => a.at - b.at);
}

/** Which server owns each key under a configuration. */
function assign({ mode, servers, vnodes }: Config): Uint8Array {
  const owner = new Uint8Array(KEYS);
  if (mode === "mod") {
    KEY_HASHES.forEach((h, i) => (owner[i] = h % servers));
    return owner;
  }
  const ring = tokens(servers, vnodes);
  KEY_HASHES.forEach((h, i) => {
    // The first token clockwise from the key (at or after its position), wrapping past the top.
    let lo = 0;
    let hi = ring.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ring[mid].at < h) lo = mid + 1;
      else hi = mid;
    }
    owner[i] = ring[lo === ring.length ? 0 : lo].server;
  });
  return owner;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const C = 120; // centre of the drawing
const R = 96; // ring radius

function point(at: number, radius: number) {
  const a = (at / SPACE) * 2 * Math.PI - Math.PI / 2;
  return [r2(C + radius * Math.cos(a)), r2(C + radius * Math.sin(a))];
}

function arc(from: number, to: number) {
  const [x1, y1] = point(from, R);
  const [x2, y2] = point(to, R);
  const large = to - from > SPACE / 2 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}

export function HashRingLab({ preset }: { preset?: Partial<Config> }) {
  const start: Config = { mode: preset?.mode ?? "mod", servers: preset?.servers ?? 4, vnodes: preset?.vnodes ?? 1 };
  const [cfg, setCfg] = useState<Config>(start);
  const [prev, setPrev] = useState<Config | null>(null);

  const change = (next: Partial<Config>) => {
    setPrev(cfg);
    setCfg({ ...cfg, ...next });
  };

  const owner = assign(cfg);
  const before = prev ? assign(prev) : null;
  let moved = 0;
  const movedSet = new Set<number>();
  if (before) {
    for (let i = 0; i < KEYS; i++) {
      if (before[i] !== owner[i]) {
        moved++;
        if (i < SHOWN) movedSet.add(i);
      }
    }
  }
  const counts = Array.from({ length: cfg.servers }, () => 0);
  owner.forEach((s) => counts[s]++);
  const avg = KEYS / cfg.servers;
  const busiest = Math.max(...counts);

  // What a perfect scheme would move: only the keys the new server takes, or the removed server held.
  let ideal: number | null = null;
  let changeLabel = "";
  if (prev && prev.servers !== cfg.servers && prev.mode === cfg.mode && prev.vnodes === cfg.vnodes) {
    ideal = 1 / Math.max(prev.servers, cfg.servers);
    changeLabel = cfg.servers > prev.servers ? `Added server ${NAMES[cfg.servers - 1]}` : `Removed server ${NAMES[prev.servers - 1]}`;
  } else if (prev) {
    changeLabel = prev.mode !== cfg.mode ? "Switched scheme" : "Changed virtual nodes";
  }

  const ring = cfg.mode === "ring" ? tokens(cfg.servers, cfg.vnodes) : [];
  const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Scheme">
        {(
          [
            ["mod", "hash mod N"],
            ["ring", "Hash ring"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={cfg.mode === id}
            onClick={() => cfg.mode !== id && change({ mode: id })}
            className={`border px-2.5 py-1 font-mono text-[0.75rem] ${cfg.mode === id ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:border-ink-2"}`}
          >
            {label}
          </button>
        ))}
        <span className="mx-2 h-5 w-px bg-line" aria-hidden />
        <button
          type="button"
          disabled={cfg.servers >= MAX_SERVERS}
          onClick={() => change({ servers: cfg.servers + 1 })}
          className="border border-line px-2.5 py-1 font-mono text-[0.75rem] text-ink-2 hover:border-ink-2 disabled:opacity-40"
        >
          + Add server
        </button>
        <button
          type="button"
          disabled={cfg.servers <= 2}
          onClick={() => change({ servers: cfg.servers - 1 })}
          className="border border-line px-2.5 py-1 font-mono text-[0.75rem] text-ink-2 hover:border-ink-2 disabled:opacity-40"
        >
          − Remove server
        </button>
      </div>

      <label className={`mt-4 block max-w-sm ${cfg.mode === "ring" ? "" : "opacity-40"}`}>
        <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
          Virtual nodes per server
          <span className="font-mono text-[0.82rem] text-ink tabular-nums">{cfg.vnodes}</span>
        </span>
        <input
          type="range"
          min={0}
          max={VNODE_STEPS.length - 1}
          step={1}
          disabled={cfg.mode !== "ring"}
          value={VNODE_STEPS.indexOf(cfg.vnodes)}
          onChange={(e) => change({ vnodes: VNODE_STEPS[Number(e.target.value)] })}
          className="mt-1.5 w-full accent-[var(--accent)]"
        />
      </label>

      <div className="mt-6 grid items-start gap-6 sm:grid-cols-[15rem_1fr]">
        <svg viewBox="0 0 240 240" className="mx-auto w-full max-w-[15rem]" role="img" aria-label={`${cfg.servers} servers, ${cfg.mode === "ring" ? "hash ring" : "hash mod N"}; ${SHOWN} keys shown as dots`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line)" strokeWidth={cfg.mode === "ring" ? 10 : 1} />
          {ring.map((t, i) => {
            const from = ring[i === 0 ? ring.length - 1 : i - 1].at;
            const start = i === 0 ? from - SPACE : from;
            return ring.length === 1 ? (
              <circle key={i} cx={C} cy={C} r={R} fill="none" stroke={color(t.server)} strokeWidth={10} />
            ) : (
              <path key={i} d={arc(Math.max(0, start), t.at)} fill="none" stroke={color(t.server)} strokeWidth={10} />
            );
          })}
          {cfg.mode === "ring" && ring.length > 1 && ring[0].at > 0 && (
            // The first token's range wraps past the top of the circle: draw that tail too.
            <path d={arc(ring[ring.length - 1].at, SPACE - 1)} fill="none" stroke={color(ring[0].server)} strokeWidth={10} />
          )}
          {cfg.mode === "ring" &&
            cfg.vnodes <= 10 &&
            ring.map((t, i) => {
              const [x1, y1] = point(t.at, R - 8);
              const [x2, y2] = point(t.at, R + 8);
              return <line key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={1} />;
            })}
          {KEY_HASHES.slice(0, SHOWN).map((h, i) => {
            const [x, y] = point(h, R - 18 - (i % 4) * 7);
            const hot = movedSet.has(i);
            return <circle key={`k${i}`} cx={x} cy={y} r={hot ? 2.6 : 1.8} fill={hot ? "var(--danger)" : color(owner[i])} />;
          })}
        </svg>

        <div>
          <div className="grid grid-cols-2 border border-line">
            <div className="p-4">
              <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Keys moved</p>
              <p className="mt-1 font-serif text-[2rem] leading-none text-ink">{prev ? pct(moved / KEYS) : "–"}</p>
              <p className="mt-1 font-mono text-[0.7rem] text-muted">{prev ? changeLabel : "Make a change to see"}</p>
              {ideal !== null && <p className="mt-1 font-mono text-[0.7rem] text-muted">A fair share would be {pct(ideal)}</p>}
            </div>
            <div className="border-l border-line p-4">
              <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">Busiest server</p>
              <p className="mt-1 font-serif text-[2rem] leading-none text-ink">{(busiest / avg).toFixed(2)}×</p>
              <p className="mt-1 font-mono text-[0.7rem] text-muted">the average load</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {counts.map((n, s) => (
              <div key={s} className="grid grid-cols-[1.5rem_1fr_3.5rem] items-center gap-3 text-[0.78rem]">
                <span className="font-mono text-ink-2">{NAMES[s]}</span>
                <span className="h-2.5 bg-paper-2">
                  <span className="block h-full" style={{ width: `${Math.round(Math.min(100, (n / (avg * 2)) * 100))}%`, background: color(s) }} />
                </span>
                <span className="text-right font-mono text-[0.7rem] text-muted tabular-nums">{n.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[0.68rem] text-muted">
            Keys per server, out of {KEYS.toLocaleString("en-US")}. Red dots moved in the last change.
          </p>
        </div>
      </div>
    </div>
  );
}
