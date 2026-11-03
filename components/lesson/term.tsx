"use client";

// A jargon word with a plain-language definition on hover, focus or tap.
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getCourse, lessonById } from "@/lib/courses";
import { glossaryEntry } from "@/lib/glossary";

type Place = { top: number; left: number; width: number; above: boolean };

/** `course` is filled in by the lesson page, so lessons only write <Term t="kernel">. */
export function Term({ t, course = "docker", children }: { t: string; course?: string; children?: ReactNode }) {
  const entry = glossaryEntry(course, t);
  const anchor = useRef<HTMLSpanElement>(null);
  const card = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [place, setPlace] = useState<Place | null>(null);
  const id = useId();

  const open = () => {
    clearTimeout(closeTimer.current);
    const r = anchor.current!.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 32);
    const left = Math.min(Math.max(16, r.left + r.width / 2 - width / 2), window.innerWidth - width - 16);
    const above = r.top > 200;
    setPlace({ top: above ? r.top - 10 : r.bottom + 10, left, width, above });
  };
  const close = (delay = 120) => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPlace(null), delay);
  };

  // A fixed card would drift away from its word on scroll, so close it; also close on outside taps.
  useEffect(() => {
    if (!place) return;
    const onScroll = () => setPlace(null);
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!anchor.current?.contains(target) && !card.current?.contains(target)) setPlace(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [place]);

  if (!entry) return <>{children}</>;
  const owner = getCourse(course);
  const lesson = entry.lesson && owner ? lessonById(owner, entry.lesson) : undefined;

  return (
    <>
      <span
        ref={anchor}
        tabIndex={0}
        aria-describedby={place ? id : undefined}
        onMouseEnter={open}
        onMouseLeave={() => close()}
        onFocus={open}
        // A tap fires focus and then click, so click only ever opens; outside taps, Escape and scrolling close.
        onBlur={(e) => {
          if (!card.current?.contains(e.relatedTarget as Node)) close();
        }}
        onClick={open}
        onKeyDown={(e) => e.key === "Escape" && setPlace(null)}
        className="cursor-help underline decoration-accent/60 decoration-dotted decoration-[1.5px] underline-offset-[5px] outline-none focus-visible:bg-accent-soft"
      >
        {children ?? entry.term}
      </span>
      {place &&
        createPortal(
          <span
            ref={card}
            id={id}
            role="tooltip"
            onMouseEnter={() => clearTimeout(closeTimer.current)}
            onMouseLeave={() => close()}
            style={{
              position: "fixed",
              top: place.top,
              left: place.left,
              width: place.width,
              transform: place.above ? "translateY(-100%)" : undefined,
            }}
            className="z-50 block border border-line bg-paper-2 px-4 py-3.5 text-left font-sans shadow-[3px_3px_0_var(--line)]"
          >
            <span className="block font-mono text-[0.62rem] tracking-[0.12em] text-accent-ink uppercase">{entry.term}</span>
            <span className="mt-1.5 block text-[0.9rem] leading-snug text-ink-2">{entry.def}</span>
            {lesson?.live && (
              <Link
                href={`/${course}/${lesson.slug}`}
                className="mt-2.5 block font-mono text-[0.68rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                Learn it properly: {lesson.id} {lesson.title} →
              </Link>
            )}
          </span>,
          document.body,
        )}
    </>
  );
}
