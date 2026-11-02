"use client";

import { useState, type ReactNode } from "react";

export type QuizOption = { text: string; correct?: boolean; why: string };

/** Predict first: pick an answer, lock it in, then see why each option is right or wrong. */
export function Quiz({ question, options, children }: { question: string; options: QuizOption[]; children?: ReactNode }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const right = picked !== null && options[picked].correct;

  return (
    <div className="not-prose my-10 border border-line">
      <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
        <span className="font-mono text-[0.68rem] tracking-[0.12em] text-accent-ink uppercase">Predict first</span>
        {locked && (
          <span className={`font-mono text-[0.68rem] tracking-[0.1em] uppercase ${right ? "text-accent-ink" : "text-danger"}`}>
            {right ? "Correct" : "Not quite"}
          </span>
        )}
      </div>
      <div className="px-5 pt-4 pb-5">
        <p className="text-[1.02rem] leading-relaxed text-ink">{question}</p>
        {children && <div className="mt-3">{children}</div>}
        <ul className="mt-4 space-y-2" role="radiogroup">
          {options.map((o, i) => {
            const state = !locked ? (picked === i ? "picked" : "idle") : o.correct ? "correct" : picked === i ? "wrong" : "dim";
            const box = {
              idle: "border-line hover:border-ink/40",
              picked: "border-ink bg-paper-2",
              correct: "border-accent bg-accent-soft/60",
              wrong: "border-danger bg-danger-soft/60",
              dim: "border-line opacity-70",
            }[state];
            return (
              <li key={i}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={picked === i}
                  disabled={locked}
                  onClick={() => setPicked(i)}
                  className={`flex w-full gap-3 border px-3.5 py-2.5 text-left transition-colors ${box}`}
                >
                  <span className="mt-px font-mono text-[0.75rem] text-muted">{String.fromCharCode(65 + i)}</span>
                  <span className="flex-1">
                    <span className="block text-[0.95rem] text-ink">{o.text}</span>
                    {locked && (state === "correct" || state === "wrong" || picked === i) && (
                      <span className="mt-1.5 block text-[0.88rem] leading-relaxed text-ink-2">{o.why}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          {!locked ? (
            <button
              type="button"
              disabled={picked === null}
              onClick={() => setLocked(true)}
              className="h-9 bg-ink px-4 text-[0.88rem] text-paper transition-opacity disabled:opacity-30"
            >
              Lock in my prediction
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLocked(false);
                setPicked(null);
              }}
              className="h-9 border border-line px-4 text-[0.88rem] text-muted hover:text-ink"
            >
              Try again
            </button>
          )}
          {!locked && <span className="text-[0.8rem] text-muted">Commit to an answer before you read on.</span>}
        </div>
      </div>
    </div>
  );
}
