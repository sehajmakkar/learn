"use client";

import { useEffect, useState } from "react";

export type Item = { id: string; text: string };

/** Right-hand contents: tick marks that track the section you're reading. */
export function Toc({ items }: { items: Item[] }) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const heads = items.map((it) => document.getElementById(it.id)).filter((h): h is HTMLElement => h !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [items]);

  if (!items.length) return null;
  return (
    <nav aria-label="On this page">
      <p className="mb-3 font-mono text-[0.65rem] tracking-[0.12em] text-muted uppercase">On this page</p>
      <ul className="space-y-1">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id}>
              <a href={`#${it.id}`} className={`group flex items-center gap-2.5 py-0.5 text-[0.8rem] ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
                <span className={`h-px shrink-0 bg-current transition-all ${on ? "w-5" : "w-2.5 opacity-60 group-hover:w-4"}`} />
                <span className="leading-snug">{it.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
