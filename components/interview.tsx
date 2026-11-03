"use client";

import { useState, type ReactNode } from "react";
import type { InterviewQ } from "@/lib/courses/types";

export function FrequencyMeter({ value, title }: { value: number; title?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" title={title ?? `Asked often: ${value} of 4 (our estimate)`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`size-[7px] ${i <= value ? "bg-accent" : "border border-line"}`} />
      ))}
    </span>
  );
}

const levelDot: Record<InterviewQ["level"], string> = {
  Junior: "bg-accent",
  Mid: "bg-[#c08a2c]",
  Senior: "bg-danger",
};

type MetaFields = Pick<InterviewQ, "level" | "frequency" | "importance" | "kind">;

/** Level, how often it's asked, importance and kind. `freq` replaces the "freq" label, e.g. "8/11 guides". */
export function QuestionMeta({ q, freq, freqTitle }: { q: MetaFields; freq?: string; freqTitle?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.68rem] tracking-[0.06em] text-muted uppercase">
      <span className="inline-flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${levelDot[q.level]}`} />
        {q.level}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <FrequencyMeter value={q.frequency} title={freqTitle} />
        {freq ?? "freq"}
      </span>
      <span className={q.importance === "Must-know" ? "text-accent-ink" : ""}>{q.importance}</span>
      <span>{q.kind}</span>
    </div>
  );
}

/** One interview question: think, say it out loud, then reveal the model answer. */
export function InterviewCard({
  q,
  children,
  followUps = [],
}: {
  q: InterviewQ;
  children: ReactNode;
  followUps?: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="not-prose my-6 border border-line bg-paper-2">
      <div className="flex flex-col gap-3 p-5">
        <QuestionMeta q={q} />
        <p className="text-[1.05rem] leading-snug text-ink">{q.q}</p>
      </div>
      {open ? (
        <div className="border-t border-line p-5 text-[0.97rem] leading-relaxed text-ink-2">
          <p className="mb-2 font-mono text-[0.68rem] tracking-[0.1em] text-muted uppercase">Model answer</p>
          <div className="space-y-3">{children}</div>
          {followUps.length > 0 && (
            <div className="mt-5 border-t border-dashed border-line pt-4">
              <p className="mb-2 font-mono text-[0.68rem] tracking-[0.1em] text-muted uppercase">Likely follow-ups</p>
              <ul className="space-y-1.5">
                {followUps.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-muted">→</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between border-t border-line px-5 py-3 text-left text-[0.9rem] text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          <span>Say your answer out loud, then reveal.</span>
          <span className="font-mono text-[0.75rem]">REVEAL ↓</span>
        </button>
      )}
    </div>
  );
}
