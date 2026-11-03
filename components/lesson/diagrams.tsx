// Static diagrams for lessons, drawn with the same hairlines as the rest of the site.
import Link from "next/link";
import type { ReactNode } from "react";
import { getCourse, lessonById } from "@/lib/courses";
import { Frame } from "@/components/lesson/frame";

type Cell = string | { text: string; tone?: "accent" | "muted" | "danger" };
type Column = { title: string; note?: string; layers: Cell[][] };

const toneCls = {
  accent: "border-accent bg-accent-soft/70 text-accent-ink",
  muted: "border-line text-muted",
  danger: "border-danger bg-danger-soft/60 text-danger",
  plain: "border-line bg-paper-2 text-ink",
};

/** Side-by-side layer stacks, top layer first. Cells in one row share the width. */
export function Stacks({ title, columns, caption }: { title: string; columns: Column[]; caption?: ReactNode }) {
  return (
    <Frame title={title} caption={caption}>
      <div className={`grid gap-6 ${columns.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {columns.map((col) => (
          <div key={col.title}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-[0.95rem] font-medium text-ink">{col.title}</span>
              {col.note && <span className="font-mono text-[0.65rem] text-muted">{col.note}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              {col.layers.map((row, r) => (
                <div key={r} className="flex gap-1.5">
                  {row.map((cell, c) => {
                    const { text, tone } = typeof cell === "string" ? { text: cell, tone: undefined } : cell;
                    return (
                      <div key={c} className={`flex-1 border px-2.5 py-2 text-center font-mono text-[0.74rem] ${toneCls[tone ?? "plain"]}`}>
                        {text}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** A left-to-right sequence of numbered steps. */
export function Flow({ title, steps, caption }: { title: string; steps: { label: string; detail: string }[]; caption?: ReactNode }) {
  return (
    <Frame title={title} caption={caption}>
      <ol className="grid gap-2 sm:auto-cols-fr sm:grid-flow-col">
        {steps.map((s, i) => (
          <li key={s.label} className="relative border border-line bg-paper-2 p-3">
            <span className="font-mono text-[0.65rem] text-muted">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-1 text-[0.9rem] font-medium text-ink">{s.label}</p>
            <p className="mt-1 text-[0.82rem] leading-snug text-ink-2">{s.detail}</p>
            {i < steps.length - 1 && (
              <span className="absolute top-1/2 -right-[0.55rem] z-10 hidden -translate-y-1/2 bg-paper font-mono text-[0.7rem] text-muted sm:block" aria-hidden>
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

/** Breaks a string into labelled parts, like a dimensioned drawing. */
export function Anatomy({ title, parts, caption }: { title: string; parts: { text: string; label?: string }[]; caption?: ReactNode }) {
  return (
    <Frame title={title} caption={caption}>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max items-start font-mono text-[0.95rem] sm:text-[1.05rem]">
          {parts.map((p, i) => (
            <div key={i} className="flex flex-col items-stretch">
              <span className={`px-px ${p.label ? "text-ink" : "text-muted"}`}>{p.text}</span>
              {p.label && (
                <span className="mt-1.5 flex flex-col items-center text-muted">
                  <span className="flex w-full items-center">
                    <span className="h-2 w-px bg-current opacity-50" />
                    <span className="h-px flex-1 bg-current opacity-30" />
                    <span className="h-2 w-px bg-current opacity-50" />
                  </span>
                  <span className="mt-1 px-1 text-[0.6rem] tracking-[0.08em] whitespace-nowrap uppercase">{p.label}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Link to another lesson by id. Lessons not written yet render as plain text. `course` comes from the lesson page. */
export function L({ id, course = "docker", children }: { id: string; course?: string; children?: ReactNode }) {
  const owner = getCourse(course);
  const target = owner ? lessonById(owner, id) : undefined;
  const label = children ?? (target ? `${id} ${target.title}` : id);
  if (target?.live) return <Link href={`/${course}/${target.slug}`}>{label}</Link>;
  return <span title="Being written">{label}</span>;
}
