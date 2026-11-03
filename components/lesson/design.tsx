// Components for system design lessons that don't need the browser:
// real-world references and what's expected at each level.
import type { ReactNode } from "react";

/** A grid of "seen in production" cards. Put <Seen> cards inside. */
export function SeenInProduction({ children }: { children: ReactNode }) {
  return (
    <section className="not-prose my-10">
      <p className="mb-3 flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">
        <span className="size-1.5 bg-accent" />
        Seen in production
      </p>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2">{children}</div>
    </section>
  );
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * One company's use of the idea. `children` says what they did in a sentence or two;
 * `found` is our one-line takeaway; `href` is the primary source (their own write-up, paper or postmortem).
 */
export function Seen({
  company,
  system,
  year,
  href,
  source,
  found,
  children,
}: {
  company: string;
  system: string;
  year: number | string;
  href: string;
  /** The source's title, as published. */
  source: string;
  found: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col bg-paper p-5 last:odd:sm:col-span-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-[1.45rem] leading-none text-ink">{company}</h3>
        <span className="font-mono text-[0.68rem] text-muted">{year}</span>
      </div>
      <p className="mt-1 font-mono text-[0.68rem] tracking-[0.06em] text-muted uppercase">{system}</p>
      <div className="mt-3 flex-1 text-[0.93rem] leading-relaxed text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink">
        {children}
      </div>
      <p className="mt-4 border-l-2 border-accent pl-3 text-[0.9rem] leading-snug text-ink">
        <span className="mr-1.5 font-mono text-[0.62rem] tracking-[0.1em] text-accent-ink uppercase">What we found</span>
        {found}
      </p>
      <a
        href={href}
        rel="noopener"
        className="group mt-4 flex items-baseline gap-2 border-t border-line-soft pt-3 text-[0.84rem] text-ink-2 hover:text-ink"
      >
        <span className="underline decoration-line underline-offset-4 group-hover:decoration-current">{source}</span>
        <span className="ml-auto shrink-0 font-mono text-[0.65rem] text-muted">{host(href)} ↗</span>
      </a>
    </article>
  );
}

/** What a good answer looks like at each level, side by side. */
export function Levels({ junior, mid, senior }: { junior: ReactNode[]; mid: ReactNode[]; senior: ReactNode[] }) {
  const cols = [
    { name: "Junior", note: "gets a working design", items: junior },
    { name: "Mid-level", note: "explains the trade-offs", items: mid },
    { name: "Senior", note: "drives it and goes deep", items: senior },
  ];
  return (
    <section className="not-prose my-10 border border-line">
      <p className="border-b border-line px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">
        What&apos;s expected at each level
      </p>
      <div className="grid sm:grid-cols-3">
        {cols.map((c, i) => (
          <div key={c.name} className={`p-5 ${i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""}`}>
            <div className="flex items-center gap-1" aria-hidden>
              {[0, 1, 2].map((d) => (
                <span key={d} className={`h-1 w-5 ${d <= i ? "bg-accent" : "bg-line"}`} />
              ))}
            </div>
            <h3 className="mt-3 text-[0.98rem] font-medium text-ink">{c.name}</h3>
            <p className="font-mono text-[0.65rem] text-muted">{c.note}</p>
            <ul className="mt-3 space-y-2 text-[0.9rem] leading-snug text-ink-2 [&_code]:font-mono [&_code]:text-[0.85em]">
              {c.items.map((item, k) => (
                <li key={k} className="relative pl-4 before:absolute before:left-0 before:text-muted before:content-['–']">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
