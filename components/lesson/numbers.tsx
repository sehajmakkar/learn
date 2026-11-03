"use client";

// A reference table of numbers worth remembering. When every row has a duration in nanoseconds,
// each gets a log-scale bar and the table can be rescaled to human time ("if 1 ns were 1 second").
import { useState, type ReactNode } from "react";

export type NumberRow = { label: ReactNode; value: string; ns?: number; note?: ReactNode };

function human(seconds: number) {
  const units: [number, string][] = [
    [365 * 86400, "years"],
    [30 * 86400, "months"],
    [86400, "days"],
    [3600, "hours"],
    [60, "minutes"],
    [1, "seconds"],
  ];
  for (const [size, name] of units) {
    if (seconds >= size) {
      const n = seconds / size;
      const shown = n >= 100 ? Math.round(n).toLocaleString("en") : n >= 10 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, "");
      return `${shown} ${shown === "1" ? name.replace(/s$/, "") : name}`;
    }
  }
  return `${seconds.toFixed(1)} seconds`;
}

export function NumbersToKnow({ title, rows, source }: { title: string; rows: NumberRow[]; source?: ReactNode }) {
  const [scaled, setScaled] = useState(false);
  const timed = rows.every((r) => r.ns !== undefined);
  const logs = timed ? rows.map((r) => Math.log10(Math.max(r.ns!, 0.1))) : [];
  const lo = Math.min(...logs, 0);
  const hi = Math.max(...logs, 1);

  return (
    <section className="not-prose my-10 border border-line">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-2.5">
        <span className="font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">Numbers to know · {title}</span>
        {timed && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-[0.82rem] text-ink-2">
            <input type="checkbox" checked={scaled} onChange={(e) => setScaled(e.target.checked)} className="size-3.5 accent-[var(--accent)]" />
            If 1 ns took 1 second
          </label>
        )}
      </div>
      <table className="w-full text-left text-[0.9rem]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line-soft last:border-b-0">
              <td className="py-2.5 pr-3 pl-5 align-top text-ink-2">
                {r.label}
                {r.note && <span className="mt-0.5 block text-[0.8rem] text-muted">{r.note}</span>}
                {timed && (
                  <span className="mt-1.5 block h-1 bg-line-soft" aria-hidden>
                    <span
                      className="block h-full bg-accent/70 transition-[width] duration-500"
                      style={{ width: `${Math.max(2, ((logs[i] - lo) / (hi - lo)) * 100)}%` }}
                    />
                  </span>
                )}
              </td>
              <td className="w-[38%] py-2.5 pr-5 text-right align-top font-mono text-[0.84rem] whitespace-nowrap text-ink tabular-nums">
                {scaled && r.ns !== undefined ? <span className="text-accent-ink">{human(r.ns)}</span> : r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(timed || source) && (
        <p className="border-t border-line-soft px-5 py-2.5 text-[0.78rem] text-muted">
          {timed && "Bars use a log scale: each step is ten times longer. "}
          {source}
        </p>
      )}
    </section>
  );
}
