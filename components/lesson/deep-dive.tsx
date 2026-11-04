// A design lesson's deep dive: one hard question, answered with options graded bad, good and great.
import type { ReactNode } from "react";

const grades = {
  bad: { label: "Bad", chip: "border-danger/60 text-danger", bar: "bg-danger" },
  good: { label: "Good", chip: "border-line text-ink-2", bar: "bg-muted" },
  great: { label: "Great", chip: "border-accent/60 bg-accent-soft text-accent-ink", bar: "bg-accent" },
} as const;

/** Put <Option> entries inside, usually in order: bad, good, great. */
export function DeepDive({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="not-prose my-10 border border-line">
      <div className="border-b border-line bg-paper-2 px-5 py-3">
        <p className="font-mono text-[0.65rem] tracking-[0.12em] text-muted uppercase">Deep dive</p>
        <h3 className="mt-1 text-[1.05rem] leading-snug font-medium text-ink">{title}</h3>
      </div>
      <div className="divide-y divide-line-soft">{children}</div>
    </section>
  );
}

export function Option({ grade, name, children }: { grade: keyof typeof grades; name: string; children: ReactNode }) {
  const g = grades[grade];
  return (
    <div className="relative px-5 py-4 pl-6">
      <span className={`absolute top-0 bottom-0 left-0 w-0.5 ${g.bar}`} aria-hidden />
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={`border px-1.5 py-px font-mono text-[0.62rem] tracking-[0.08em] uppercase ${g.chip}`}>{g.label}</span>
        <span className="text-[0.97rem] font-medium text-ink">{name}</span>
      </div>
      <div className="mt-2 space-y-2 text-[0.94rem] leading-relaxed text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink [&_strong]:text-ink [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </div>
  );
}
