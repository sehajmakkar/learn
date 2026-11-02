// Small pieces of the "technical drawing" layer: section labels, dimension lines, bands.
import type { ReactNode } from "react";

export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} className="rule-bleed relative flex justify-center py-3">
      <span className="font-mono text-[0.7rem] tracking-[0.14em] text-muted uppercase">{children}</span>
    </div>
  );
}

export function HatchBand({ label }: { label?: string }) {
  return (
    <div className="relative">
      <div className="rule-bleed hatch relative h-8">
        <div className="absolute inset-x-[-100vw] bottom-0 border-b border-line" />
      </div>
      {label && (
        <span className="absolute top-1/2 -right-12 hidden -translate-y-1/2 font-mono text-[0.65rem] text-muted lg:block">
          {label}
        </span>
      )}
    </div>
  );
}

/** A horizontal dimension line with end ticks and a centred label. */
export function Dimension({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-muted ${className}`} aria-hidden>
      <span className="h-2.5 w-px bg-current opacity-50" />
      <span className="h-px flex-1 bg-current opacity-30" />
      <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase">{children}</span>
      <span className="h-px flex-1 bg-current opacity-30" />
      <span className="h-2.5 w-px bg-current opacity-50" />
    </div>
  );
}

/** A handwritten margin note with a small curved arrow. */
export function PenNote({
  children,
  className = "",
  arrow = "down-right",
}: {
  children: ReactNode;
  className?: string;
  arrow?: "down-right" | "down-left";
}) {
  return (
    <div className={`pointer-events-none flex flex-col text-muted ${className}`} aria-hidden>
      <span className="-rotate-6 font-pen text-[1.35rem] leading-none whitespace-nowrap">{children}</span>
      <svg
        width="34"
        height="26"
        viewBox="0 0 34 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className={arrow === "down-left" ? "-scale-x-100 self-start" : "ml-6"}
      >
        <path d="M3 3c4 10 12 17 26 19" />
        <path d="M23 17l6 5-7 2" />
      </svg>
    </div>
  );
}
