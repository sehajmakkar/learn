"use client";

import { useState, type ReactNode } from "react";

/** A hands-on task: do it, compare with the expected result, peek at the fix if stuck. */
export function Checkpoint({ title, children, solution }: { title: string; children: ReactNode; solution?: ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <section className="not-prose my-10 border border-line">
      <div className="flex items-center gap-3 border-b border-line px-5 py-2.5">
        <span className="font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">Checkpoint</span>
        <span className="text-[0.92rem] text-ink">{title}</span>
      </div>
      <div className="px-5 py-4 text-[0.96rem] leading-relaxed text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink [&>figure]:my-4 [&>p+p]:mt-3">
        {children}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-ink">
          <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          I ran it and my output matches
        </label>
        {solution && (
          <details className="group ml-auto text-[0.88rem]">
            <summary className="cursor-pointer list-none font-mono text-[0.7rem] text-muted hover:text-ink">STUCK? ▸</summary>
            <div className="mt-2 max-w-[520px] text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em]">{solution}</div>
          </details>
        )}
      </div>
    </section>
  );
}
