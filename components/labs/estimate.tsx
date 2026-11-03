"use client";

// Back-of-the-envelope estimation: from users and habits to requests per second and storage.
import { useState } from "react";

const SECONDS_PER_DAY = 86_400;

function compact(n: number) {
  if (n >= 1e12) return `${+(n / 1e12).toPrecision(3)}T`;
  if (n >= 1e9) return `${+(n / 1e9).toPrecision(3)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toPrecision(3)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toPrecision(3)}K`;
  return n >= 10 ? Math.round(n).toString() : (+n.toPrecision(2)).toString();
}

function bytes(n: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${+n.toPrecision(3)} ${units[i]}`;
}

type Field = { key: keyof Inputs; label: string; unit: string; min: number; max: number; step: number; log?: boolean };
type Inputs = { users: number; writes: number; ratio: number; size: number; years: number; peak: number };

const fields: Field[] = [
  { key: "users", label: "Daily active users", unit: "", min: 3, max: 9, step: 0.1, log: true },
  { key: "writes", label: "Writes per user per day", unit: "", min: 0.1, max: 50, step: 0.1 },
  { key: "ratio", label: "Reads for every write", unit: "×", min: 1, max: 1000, step: 1 },
  { key: "size", label: "Bytes stored per write", unit: "B", min: 50, max: 5000, step: 50 },
  { key: "years", label: "Keep data for", unit: "years", min: 1, max: 10, step: 1 },
  { key: "peak", label: "Peak traffic vs average", unit: "×", min: 1, max: 10, step: 0.5 },
];

export function EstimateLab({ preset }: { preset?: Partial<Inputs> }) {
  const [v, setV] = useState<Inputs>({ users: 1e7, writes: 1, ratio: 100, size: 500, years: 5, peak: 3, ...preset });

  const writesPerDay = v.users * v.writes;
  const writeQps = writesPerDay / SECONDS_PER_DAY;
  const readQps = writeQps * v.ratio;
  const storage = writesPerDay * 365 * v.years * v.size;

  const out = [
    { label: "Writes / second", value: compact(writeQps), sub: `peak ~${compact(writeQps * v.peak)}` },
    { label: "Reads / second", value: compact(readQps), sub: `peak ~${compact(readQps * v.peak)}` },
    { label: `Storage over ${v.years} ${v.years === 1 ? "year" : "years"}`, value: bytes(storage), sub: `${bytes(writesPerDay * v.size)} a day` },
  ];

  return (
    <div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {fields.map((f) => {
          const raw = v[f.key];
          const pos = f.log ? Math.log10(raw) : raw;
          const shown = f.key === "users" ? compact(raw) : f.key === "size" ? bytes(raw) : `${raw}${f.unit ? ` ${f.unit}` : ""}`;
          return (
            <label key={f.key} className="block">
              <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
                {f.label}
                <span className="font-mono text-[0.82rem] text-ink tabular-nums">{shown}</span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={pos}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setV({ ...v, [f.key]: f.log ? Math.round(10 ** n) : n });
                }}
                className="mt-1.5 w-full accent-[var(--accent)]"
              />
            </label>
          );
        })}
      </div>

      <div className="mt-6 grid border border-line sm:grid-cols-3">
        {out.map((o, i) => (
          <div key={o.label} className={`p-4 ${i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""}`}>
            <p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted uppercase">{o.label}</p>
            <p className="mt-1 font-serif text-[2rem] leading-none text-ink">{o.value}</p>
            <p className="mt-1 font-mono text-[0.7rem] text-muted">{o.sub}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 font-mono text-[0.72rem] leading-relaxed text-muted">
        {compact(v.users)} users × {v.writes} writes ÷ 86,400 s = {compact(writeQps)} writes/s · × {v.ratio} = {compact(readQps)} reads/s ·
        {" "}
        {compact(writesPerDay)} writes/day × 365 × {v.years} × {bytes(v.size)} = {bytes(storage)}
      </p>
    </div>
  );
}
