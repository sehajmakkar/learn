import type { ReactNode } from "react";

/** The hairline box every lesson diagram sits in: a mono title bar, the drawing, an optional caption. */
export function Frame({
  title,
  children,
  caption,
  footer,
}: {
  title: ReactNode;
  children: ReactNode;
  caption?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <figure className="not-prose my-10 border border-line">
      <div className="border-b border-line px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">{title}</div>
      <div className="px-5 py-5">{children}</div>
      {caption && <figcaption className="border-t border-line-soft px-5 py-3 text-[0.9rem] leading-relaxed text-ink-2">{caption}</figcaption>}
      {footer}
    </figure>
  );
}

/** Collapsed text version of a diagram, for screen readers, small screens and copy-paste. */
export function TextVersion({ children }: { children: ReactNode }) {
  return (
    <details className="border-t border-line-soft px-5 py-2.5 text-[0.88rem] text-ink-2">
      <summary className="cursor-pointer font-mono text-[0.65rem] tracking-[0.1em] text-muted uppercase hover:text-ink">
        Text version
      </summary>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </details>
  );
}
