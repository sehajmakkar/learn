import type { ReactNode } from "react";

export function BeforeYouStart({ children }: { children: ReactNode }) {
  return (
    <aside className="not-prose my-8 border-l-2 border-accent bg-accent-soft/60 px-5 py-4">
      <p className="font-mono text-[0.68rem] tracking-[0.12em] text-accent-ink uppercase">Before you start</p>
      <div className="mt-2 space-y-2 text-[0.97rem] leading-relaxed text-ink-2 [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </aside>
  );
}

export function Mistakes({ children }: { children: ReactNode }) {
  return (
    <aside className="not-prose my-8 border border-line">
      <p className="flex items-center gap-2 border-b border-line px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.12em] text-danger uppercase">
        <span className="size-1.5 bg-danger" />
        Common mistakes
      </p>
      <div className="px-5 py-4 text-[0.96rem] leading-relaxed text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink [&_li]:relative [&_li]:pl-5 [&_li+li]:mt-3 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-danger [&_li]:before:content-['×'] [&_strong]:text-ink">
        {children}
      </div>
    </aside>
  );
}

export function Aside({ title = "Going further", children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="not-prose my-8 border border-dashed border-line px-5 py-4">
      <p className="font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">{title}</p>
      <div className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink">
        {children}
      </div>
    </aside>
  );
}

/** Written by Sehaj after doing the lesson: what actually went wrong. */
export function Tripped({ children }: { children: ReactNode }) {
  return (
    <aside className="not-prose relative my-10 -rotate-[0.4deg] border border-line bg-paper-2 px-5 pt-4 pb-5 shadow-[3px_3px_0_var(--line)]">
      <p className="font-pen text-[1.5rem] leading-none text-accent-ink">what tripped me up</p>
      <div className="mt-2 font-pen text-[1.35rem] leading-snug text-ink-2">{children}</div>
    </aside>
  );
}

export function Recap({ children }: { children: ReactNode }) {
  return (
    <aside className="not-prose my-8 bg-ink px-6 py-5 text-paper">
      <p className="font-mono text-[0.68rem] tracking-[0.12em] uppercase opacity-60">Recap</p>
      {/* Arrow is absolutely placed so inline code in an item flows with the text instead of becoming a flex column. */}
      <div className="mt-3 text-[0.97rem] leading-relaxed [&_li]:relative [&_li]:pl-7 [&_li+li]:mt-2 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:font-mono [&_li]:before:opacity-50 [&_li]:before:content-['→'] [&_code]:font-mono [&_code]:text-[0.85em]">
        {children}
      </div>
    </aside>
  );
}
