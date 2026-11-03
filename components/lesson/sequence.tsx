"use client";

// Sequence diagrams: who sends what to whom, in order. Good for request lifecycles,
// retries, two-phase commit and consensus messages. With `walk`, readers step through one message at a time.
import { useId, useState, type ReactNode } from "react";
import { Frame, TextVersion } from "@/components/lesson/frame";

export type SeqMessage = {
  from: string;
  to: string;
  label: string;
  /** A response: drawn dashed. */
  reply?: boolean;
  /** The message is lost or fails (a timeout, a crash): drawn in red and ending in a cross. */
  fail?: boolean;
  /** What this message means, shown while walking through. */
  explain?: ReactNode;
};
export type SeqNote = { note: string; over: string[] };
export type SeqRow = SeqMessage | SeqNote;

const COL = 168;
const PAD = 22;
const HEAD = 34;
const ROW = 40;
const NOTE = 36;

const isNote = (r: SeqRow): r is SeqNote => "note" in r;

/** Numbers the messages (not the notes) and lays the rows out top to bottom. */
function layout(messages: SeqRow[]) {
  let y = PAD + HEAD + 24;
  let n = 0;
  const rows = messages.map((r) => {
    const row = { r, y, index: isNote(r) ? -1 : n++ };
    y += isNote(r) ? NOTE : r.from === r.to ? ROW + 12 : ROW;
    return row;
  });
  return { rows, height: y + 10, count: n };
}

export function Sequence({
  title,
  participants,
  messages,
  walk = false,
  caption,
}: {
  title: string;
  participants: (string | { id: string; label: string })[];
  messages: SeqRow[];
  walk?: boolean;
  caption?: ReactNode;
}) {
  const uid = useId().replace(/:/g, "");
  const [step, setStep] = useState(-1);
  const people = participants.map((p) => (typeof p === "string" ? { id: p, label: p } : p));
  const col = new Map(people.map((p, i) => [p.id, PAD + i * COL + COL / 2]));
  const label = new Map(people.map((p) => [p.id, p.label]));
  const width = PAD * 2 + people.length * COL;

  const { rows, height, count } = layout(messages);
  const walking = walk && step >= 0;
  const current = walking ? (rows.find((x) => x.index === step)?.r as SeqMessage | undefined) : undefined;

  const stateOf = (index: number) => (!walking ? "idle" : index === step ? "active" : index < step ? "idle" : "dim");
  // A note belongs with the message before it.
  const noteState = (i: number) => {
    const prev = rows.slice(0, i).reverse().find((x) => x.index >= 0)?.index ?? -1;
    return !walking ? "idle" : prev <= step ? "idle" : "dim";
  };

  const btn =
    "inline-flex h-8 items-center gap-1.5 border border-line px-3 text-[0.82rem] text-ink transition-colors hover:bg-paper-2 disabled:pointer-events-none disabled:opacity-40";

  const footer = (
    <>
      {walk && (
        <div className="border-t border-line-soft px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {step < 0 ? (
              <button type="button" className={`${btn} border-ink bg-ink text-paper hover:bg-ink hover:opacity-85`} onClick={() => setStep(0)}>
                Step through it <span aria-hidden>→</span>
              </button>
            ) : (
              <>
                <button type="button" className={btn} onClick={() => setStep(step - 1)} aria-label="Previous message">
                  <span aria-hidden>←</span> Back
                </button>
                <span className="px-1 font-mono text-[0.72rem] text-muted">
                  {step + 1} of {count}
                </span>
                <button type="button" className={btn} onClick={() => setStep(step + 1)} disabled={step === count - 1} aria-label="Next message">
                  Next <span aria-hidden>→</span>
                </button>
                <button type="button" className="ml-auto text-[0.8rem] text-muted underline decoration-line underline-offset-4 hover:text-ink" onClick={() => setStep(-1)}>
                  Show all
                </button>
              </>
            )}
          </div>
          <p className="mt-2.5 min-h-[1.5em] text-[0.92rem] leading-relaxed text-ink-2" aria-live="polite">
            {current ? (
              <>
                <span className="mr-2 font-mono text-[0.72rem] text-accent-ink">{step + 1}.</span>
                {current.explain ?? `${label.get(current.from)} sends ${current.label} to ${label.get(current.to)}.`}
              </>
            ) : (
              <span className="text-muted">{count} messages. Use Next and Back to follow them in order.</span>
            )}
          </p>
        </div>
      )}
      <TextVersion>
        <ol className="list-decimal pl-5">
          {messages.map((r, i) =>
            isNote(r) ? (
              <li key={i} className="list-none text-muted">
                Note over {r.over.map((id) => label.get(id)).join(" and ")}: {r.note}
              </li>
            ) : (
              <li key={i}>
                {label.get(r.from)} → {label.get(r.to)}: {r.label}
                {r.reply && " (reply)"}
                {r.fail && " (fails)"}
                {r.explain && <> — {r.explain}</>}
              </li>
            ),
          )}
        </ol>
      </TextVersion>
    </>
  );

  return (
    <Frame title={title} caption={caption} footer={footer}>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", minWidth: Math.min(width * 0.75, 520) }}
          role="img"
          aria-label={title}
          className="block"
        >
          <defs>
            {(["off", "on", "bad", "dim"] as const).map((m) => (
              <marker key={m} id={`${uid}-${m}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path
                  d="M0 1 9 5 0 9z"
                  className={m === "on" ? "fill-accent" : m === "bad" ? "fill-danger" : m === "dim" ? "fill-muted/25" : "fill-ink-2"}
                />
              </marker>
            ))}
          </defs>

          {people.map((p) => {
            const x = col.get(p.id)!;
            return (
              <g key={p.id}>
                <line x1={x} y1={PAD + HEAD} x2={x} y2={height - 6} className="stroke-muted/50" strokeDasharray="3 4" />
                <rect x={x - 62} y={PAD} width="124" height={HEAD} rx="3" className="fill-paper-2 stroke-muted/70" />
                <text x={x} y={PAD + HEAD / 2 + 4} textAnchor="middle" className="fill-ink font-sans text-[13.5px]">
                  {p.label}
                </text>
              </g>
            );
          })}

          {rows.map(({ r, y, index }, i) => {
            if (isNote(r)) {
              const xs = r.over.map((id) => col.get(id)!).filter((v) => v !== undefined);
              const x0 = Math.min(...xs) - 58;
              const x1 = Math.max(...xs) + 58;
              const dim = noteState(i) === "dim";
              return (
                <g key={i} className={`transition-opacity duration-300 ${dim ? "opacity-20" : ""}`}>
                  <rect x={x0} y={y + 4} width={x1 - x0} height={NOTE - 10} className="fill-accent-soft/60 stroke-accent/40" />
                  <text x={(x0 + x1) / 2} y={y + NOTE / 2 + 3} textAnchor="middle" className="fill-ink-2 font-sans text-[12px] italic">
                    {r.note}
                  </text>
                </g>
              );
            }
            const s = stateOf(index);
            const a = col.get(r.from)!;
            const b = col.get(r.to)!;
            const self = r.from === r.to;
            const lineY = y + ROW - 12;
            const stroke = r.fail ? "stroke-danger" : s === "active" ? "stroke-accent" : s === "dim" ? "stroke-muted/25" : "stroke-ink-2";
            const text = r.fail ? "fill-danger" : s === "active" ? "fill-accent-ink" : s === "dim" ? "fill-muted/30" : "fill-ink";
            const marker = `url(#${uid}-${r.fail ? "bad" : s === "active" ? "on" : s === "dim" ? "dim" : "off"})`;
            const dir = b >= a ? 1 : -1;
            const end = r.fail ? a + (b - a) * 0.72 : b - dir * 3;
            return (
              <g key={i} className="transition-opacity duration-300">
                {self ? (
                  <path
                    d={`M${a} ${lineY - 6} h34 v18 h-31`}
                    className={`fill-none ${stroke}`}
                    strokeWidth={s === "active" ? 1.6 : 1.1}
                    strokeDasharray={r.reply ? "4 3" : undefined}
                    markerEnd={marker}
                  />
                ) : (
                  <line
                    x1={a + dir * 2}
                    y1={lineY}
                    x2={end}
                    y2={lineY}
                    className={stroke}
                    strokeWidth={s === "active" ? 1.6 : 1.1}
                    strokeDasharray={r.reply ? "4 3" : undefined}
                    markerEnd={r.fail ? undefined : marker}
                  />
                )}
                {r.fail && !self && (
                  <path d={`M${end - 5} ${lineY - 5} l10 10 M${end + 5} ${lineY - 5} l-10 10`} className="stroke-danger" strokeWidth="1.6" />
                )}
                <text
                  x={self ? a + 42 : (a + (r.fail ? end : b)) / 2}
                  y={self ? lineY + 7 : lineY - 6}
                  textAnchor={self ? "start" : "middle"}
                  className={`font-mono text-[11.5px] ${text}`}
                  stroke="var(--paper)"
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  <tspan className={s === "active" ? "fill-accent-ink" : "fill-muted"}>{index + 1} </tspan>
                  {r.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Frame>
  );
}
