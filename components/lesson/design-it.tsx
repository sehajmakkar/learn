"use client";

// "Design it yourself first": the prompt, a timer, a place for notes, then a self-review rubric.
import { useEffect, useState, type ReactNode } from "react";
import { useStoredList, useStoredText } from "@/components/lesson/progress";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function DesignIt({
  id,
  minutes = 30,
  levels,
  patterns,
  rubric,
  children,
}: {
  /** Unique per exercise; keys the saved notes and rubric ticks. */
  id: string;
  minutes?: number;
  levels?: ("junior" | "mid" | "senior")[];
  patterns?: string[];
  /** What a strong answer covers, shown after the reader is done. */
  rubric: ReactNode[];
  children: ReactNode;
}) {
  const [notes, setNotes] = useStoredText(`learn:design-notes:${id}`);
  const { items: ticked, toggle } = useStoredList(`learn:design-rubric:${id}`);
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const started = running || left < minutes * 60;
  const covered = rubric.filter((_, i) => ticked.includes(String(i))).length;
  const chip = "border border-line px-1.5 py-px font-mono text-[0.62rem] tracking-[0.06em] uppercase";

  return (
    <section className="not-prose my-10 border border-ink/70">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-paper-2 px-5 py-3">
        <span className="font-mono text-[0.68rem] tracking-[0.12em] text-ink uppercase">Design it yourself first</span>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {levels?.map((l) => (
            <span key={l} className={`${chip} border-accent/50 text-accent-ink`}>
              {l}
            </span>
          ))}
          {patterns?.map((p) => (
            <span key={p} className={`${chip} text-muted`}>
              {p}
            </span>
          ))}
        </span>
      </div>

      <div className="px-5 py-5 text-[1rem] leading-relaxed text-ink [&_code]:font-mono [&_code]:text-[0.85em] [&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-muted [&_li]:before:content-['–'] [&_li+li]:mt-1 [&>*+*]:mt-3">
        {children}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
        <span
          className={`font-mono text-[1.35rem] tabular-nums ${left === 0 ? "text-danger" : running ? "text-accent-ink" : "text-ink"}`}
          aria-live="off"
        >
          {fmt(left)}
        </span>
        <button
          type="button"
          onClick={() => (left === 0 ? (setLeft(minutes * 60), setRunning(true)) : setRunning(!running))}
          className="inline-flex h-8 items-center border border-line px-3 text-[0.84rem] text-ink transition-colors hover:bg-paper-2"
        >
          {running ? "Pause" : left === 0 ? "Restart" : started ? "Resume" : `Start the ${minutes}-minute timer`}
        </button>
        {started && !running && left > 0 && (
          <button type="button" onClick={() => setLeft(minutes * 60)} className="text-[0.8rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">
            Reset
          </button>
        )}
        {left === 0 && <span className="text-[0.85rem] text-danger">Time&apos;s up. Wrap up and compare.</span>}
      </div>

      <div className="border-t border-line px-5 py-4">
        <label htmlFor={`notes-${id}`} className="font-mono text-[0.65rem] tracking-[0.1em] text-muted uppercase">
          Your notes <span className="normal-case tracking-normal">· saved in this browser</span>
        </label>
        <textarea
          id={`notes-${id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder={"Requirements…\nEstimates…\nAPI…\nHigh-level design…\nDeep dives…"}
          className="mt-2 block w-full resize-y border border-line bg-paper-2 px-3 py-2.5 font-mono text-[0.84rem] leading-relaxed text-ink outline-none placeholder:text-muted/60 focus:border-ink"
        />
      </div>

      {reviewing ? (
        <div className="border-t border-line px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">Self-review: did your design…</p>
            <span className="font-mono text-[0.72rem] text-accent-ink">
              {covered} of {rubric.length}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {rubric.map((r, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2.5 text-[0.93rem] leading-snug text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em]">
                  <input
                    type="checkbox"
                    checked={ticked.includes(String(i))}
                    onChange={() => toggle(String(i))}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span>{r}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.88rem] text-muted">Now read on: the walkthrough below builds the design one step at a time.</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setReviewing(true);
          }}
          className="flex w-full items-center justify-between border-t border-line px-5 py-3 text-left text-[0.9rem] text-muted transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <span>Done, or stuck? Check your design against the rubric.</span>
          <span className="font-mono text-[0.75rem]">REVIEW ↓</span>
        </button>
      )}
    </section>
  );
}
