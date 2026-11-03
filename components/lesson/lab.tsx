"use client";

// The frame every interactive lab sits in: a title, the simulator, things to try, and a reset.
import { useState, type ReactNode } from "react";
import { useStoredList } from "@/components/lesson/progress";

export function Lab({
  id,
  title,
  tasks,
  children,
}: {
  /** Unique per lab; keys which tasks the reader has ticked off. */
  id: string;
  title: string;
  /** Things to try, each a small question the simulator answers. */
  tasks?: ReactNode[];
  children: ReactNode;
}) {
  const [run, setRun] = useState(0);
  const { items: done, toggle } = useStoredList(`learn:lab:${id}`);

  return (
    <section className="not-prose my-10 border border-line">
      <div className="hatch flex items-center gap-3 border-b border-line px-5 py-2.5">
        <span className="bg-paper px-1.5 py-0.5 font-mono text-[0.68rem] tracking-[0.12em] text-accent-ink uppercase">Lab</span>
        <span className="bg-paper px-1.5 py-0.5 text-[0.92rem] text-ink">{title}</span>
        <button
          type="button"
          onClick={() => setRun(run + 1)}
          className="ml-auto bg-paper px-2 py-0.5 font-mono text-[0.68rem] text-muted uppercase hover:text-ink"
        >
          ↺ Reset
        </button>
      </div>
      <div key={run} className="px-5 py-5">
        {children}
      </div>
      {tasks && tasks.length > 0 && (
        <div className="border-t border-line px-5 py-4">
          <p className="font-mono text-[0.65rem] tracking-[0.12em] text-muted uppercase">Try this</p>
          <ul className="mt-2.5 space-y-2">
            {tasks.map((t, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2.5 text-[0.92rem] leading-snug text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em]">
                  <input
                    type="checkbox"
                    checked={done.includes(String(i))}
                    onChange={() => toggle(String(i))}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span className={done.includes(String(i)) ? "text-muted line-through decoration-line" : ""}>{t}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
