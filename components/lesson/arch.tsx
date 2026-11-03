"use client";

// Architecture diagrams drawn from data: boxes on a grid, labelled arrows, dashed boundaries.
// <Arch> can step through a request's path; <Evolve> shows the same system before and after one change.
import { useId, useState, type ReactNode } from "react";
import { Frame, TextVersion } from "@/components/lesson/frame";

export type ArchKind =
  | "user"
  | "client"
  | "dns"
  | "cdn"
  | "lb"
  | "service"
  | "worker"
  | "cache"
  | "db"
  | "queue"
  | "store"
  | "external";

/** x and y are grid cells (column, row) from the top left; halves are fine. */
export type ArchNode = { id: string; label: string; kind?: ArchKind; sub?: string; x: number; y: number };
export type ArchEdge = { from: string; to: string; label?: string; dashed?: boolean; both?: boolean };
/** A dashed boundary around some nodes: a network, region, availability zone or trust boundary. */
export type ArchGroup = { label: string; nodes: string[]; pad?: number };
/** One step of a walkthrough. Edges are written "from>to"; nodes default to the edges' ends. */
export type ArchStep = { caption: ReactNode; edges?: string[]; nodes?: string[] };
export type ArchDiagram = { nodes: ArchNode[]; edges?: ArchEdge[]; groups?: ArchGroup[] };

type State = "idle" | "active" | "visited" | "dim" | "added" | "removed";

const COL = 216;
const ROW = 104;
const W = 148;
const H = 58;
const PAD = 30;

const edgeId = (e: { from: string; to: string }) => `${e.from}>${e.to}`;

// 16×16 line glyphs, one per kind of box.
const glyphs: Record<ArchKind, string> = {
  user: "M8 2.5a2.75 2.75 0 1 0 0 5.5a2.75 2.75 0 1 0 0-5.5M2.5 14.5c0-3 2.5-4.75 5.5-4.75s5.5 1.75 5.5 4.75",
  client: "M2.5 3h11v7.5h-11zM1 13h14",
  dns: "M8 1.5v13M8 3h5.5l1.5 2-1.5 2H8M8 8H2.5L1 10l1.5 2H8",
  cdn: "M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M1.5 8h13M8 1.5c-2.7 2.8-2.7 10.2 0 13M8 1.5c2.7 2.8 2.7 10.2 0 13",
  lb: "M1 8h5M6 8l3.5-4.5H15M6 8l3.5 4.5H15M6 8h9",
  service: "M2 2h12v12H2zM5 6h6M5 10h6",
  worker: "M8 5.25a2.75 2.75 0 1 0 0 5.5a2.75 2.75 0 1 0 0-5.5M8 1v2.25M8 12.75V15M1 8h2.25M12.75 8H15M3 3l1.6 1.6M11.4 11.4 13 13M13 3l-1.6 1.6M4.6 11.4 3 13",
  cache: "M9.5 1 3.5 9h4.5l-1.5 6 6-8.5H8z",
  db: "M2.5 3.75a5.5 1.75 0 1 0 11 0a5.5 1.75 0 1 0-11 0M2.5 3.75v8.5a5.5 1.75 0 0 0 11 0v-8.5M2.5 8a5.5 1.75 0 0 0 11 0",
  queue: "M1.5 3.5h3v9h-3zM6.5 3.5h3v9h-3zM11.5 3.5h3v9h-3z",
  store: "M1.5 4h13l-1.75 10H3.25zM1.5 4a6.5 1.5 0 0 0 13 0",
  external: "M4.5 12.5a3 3 0 0 1-.25-6a4.25 4.25 0 0 1 8 .75a2.75 2.75 0 0 1 .25 5.25z",
};

const nodeCls: Record<State, { box: string; text: string; glyph: string }> = {
  idle: { box: "fill-paper-2 stroke-muted/70", text: "fill-ink", glyph: "text-muted" },
  active: { box: "fill-accent-soft stroke-accent", text: "fill-accent-ink", glyph: "text-accent-ink" },
  visited: { box: "fill-paper-2 stroke-accent/60", text: "fill-ink", glyph: "text-accent-ink/80" },
  dim: { box: "fill-paper-2 stroke-muted/40", text: "fill-ink/40", glyph: "text-muted/40" },
  added: { box: "fill-accent-soft stroke-accent", text: "fill-accent-ink", glyph: "text-accent-ink" },
  removed: { box: "fill-danger-soft/50 stroke-danger", text: "fill-danger", glyph: "text-danger" },
};

const edgeCls: Record<State, string> = {
  idle: "stroke-muted",
  active: "stroke-accent",
  visited: "stroke-accent/55",
  dim: "stroke-muted/30",
  added: "stroke-accent",
  removed: "stroke-danger",
};

function bounds(nodes: ArchNode[]) {
  const cols = Math.max(...nodes.map((n) => n.x)) + 1;
  const rows = Math.max(...nodes.map((n) => n.y)) + 1;
  return { cols, rows };
}

function ArchCanvas({
  diagram,
  title,
  cols,
  rows,
  nodeState = () => "idle",
  edgeState = () => "idle",
  badge = () => undefined,
}: {
  diagram: ArchDiagram;
  title: string;
  cols: number;
  rows: number;
  nodeState?: (id: string) => State;
  edgeState?: (id: string) => State;
  badge?: (id: string) => number | undefined;
}) {
  const uid = useId().replace(/:/g, "");
  const width = PAD * 2 + cols * COL;
  const height = PAD * 2 + rows * ROW;
  const at = new Map(
    diagram.nodes.map((n) => [n.id, { n, x: PAD + n.x * COL + COL / 2, y: PAD + n.y * ROW + ROW / 2 }]),
  );
  const edges = diagram.edges ?? [];
  const ids = new Set(edges.map(edgeId));
  const markerFor = (s: State) => (s === "active" || s === "added" || s === "visited" ? "on" : s === "removed" ? "bad" : s === "dim" ? "dim" : "off");

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", minWidth: Math.min(width * 0.72, 540) }}
        role="img"
        aria-label={title}
        className="block"
      >
        <defs>
          {(["off", "on", "bad", "dim"] as const).map((m) => (
            <marker
              key={m}
              id={`${uid}-${m}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M0 1 9 5 0 9z"
                className={m === "on" ? "fill-accent" : m === "bad" ? "fill-danger" : m === "dim" ? "fill-muted/30" : "fill-muted"}
              />
            </marker>
          ))}
        </defs>

        {(diagram.groups ?? []).map((g) => {
          const members = g.nodes.map((id) => at.get(id)).filter((v) => v !== undefined);
          if (!members.length) return null;
          const pad = g.pad ?? 14;
          const x0 = Math.min(...members.map((m) => m.x)) - W / 2 - pad;
          const x1 = Math.max(...members.map((m) => m.x)) + W / 2 + pad;
          const y0 = Math.min(...members.map((m) => m.y)) - H / 2 - pad - 12;
          const y1 = Math.max(...members.map((m) => m.y)) + H / 2 + pad;
          return (
            <g key={g.label}>
              <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="3" className="fill-none stroke-muted/60" strokeDasharray="5 4" />
              <text x={x0 + 9} y={y0 + 14} className="fill-muted font-mono text-[10px] tracking-[0.08em] uppercase">
                {g.label}
              </text>
            </g>
          );
        })}

        {edges.map((e) => {
          const a = at.get(e.from);
          const b = at.get(e.to);
          if (!a || !b) return null;
          const id = edgeId(e);
          const s = edgeState(id);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          // A reply drawn alongside its request sits a little to one side.
          const off = ids.has(`${e.to}>${e.from}`) ? 7 : 0;
          const nx = -uy * off;
          const ny = ux * off;
          const clip = (gap: number) => Math.min((W / 2 + gap) / Math.abs(ux || 1e-9), (H / 2 + gap) / Math.abs(uy || 1e-9));
          const t0 = clip(e.both ? 5 : 2);
          const t1 = clip(5);
          const x1 = a.x + ux * t0 + nx;
          const y1 = a.y + uy * t0 + ny;
          const x2 = b.x - ux * t1 + nx;
          const y2 = b.y - uy * t1 + ny;
          const n = badge(id);
          // Labels sit beside the arrow: above a level one, to the outside of a request/reply pair.
          const flat = Math.abs(uy) < 0.35;
          const upright = Math.abs(ux) < 0.35;
          const side = off ? 1.9 : 0;
          // A sloped arrow's label is pushed off the line, towards the upper side.
          const lean = !flat && !upright && !off ? (ux * uy > 0 ? 1 : -1) * 11 : 0;
          const mid = {
            x: (x1 + x2) / 2 + nx * side + (upright && !off ? 7 : 0) + Math.abs(uy) * lean,
            y: (y1 + y2) / 2 + (flat && !off ? -8 : ny * side + (flat && ny < 0 ? -2 : 0)) - Math.abs(ux) * Math.abs(lean),
          };
          const anchor = upright ? (off ? (nx < 0 ? "end" : "start") : "start") : "middle";
          const near = { x: x1 + ux * 16, y: y1 + uy * 16 };
          const marker = `url(#${uid}-${markerFor(s)})`;
          return (
            <g key={id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`${edgeCls[s]} transition-[stroke] duration-300`}
                strokeWidth={s === "active" || s === "added" ? 1.7 : 1.1}
                strokeDasharray={e.dashed || s === "removed" ? "4 3" : undefined}
                markerEnd={marker}
                markerStart={e.both ? marker : undefined}
              />
              {e.label && (
                <text
                  x={mid.x}
                  y={mid.y + 3.5}
                  textAnchor={anchor}
                  className={`font-mono text-[11px] ${s === "dim" ? "fill-muted/40" : s === "active" || s === "added" ? "fill-accent-ink" : "fill-ink-2"}`}
                  stroke="var(--paper)"
                  strokeWidth="4"
                  paintOrder="stroke"
                  strokeLinejoin="round"
                >
                  {e.label}
                </text>
              )}
              {n !== undefined && (
                <g>
                  <circle cx={near.x} cy={near.y} r="8" className={s === "active" ? "fill-accent" : "fill-accent/60"} />
                  <text x={near.x} y={near.y + 3.3} textAnchor="middle" className="fill-paper font-mono text-[9.5px] font-semibold">
                    {n}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {diagram.nodes.map((n) => {
          const p = at.get(n.id)!;
          const s = nodeState(n.id);
          const c = nodeCls[s];
          const x0 = p.x - W / 2;
          const y0 = p.y - H / 2;
          return (
            <g key={n.id} className="transition-opacity duration-300">
              <rect
                x={x0}
                y={y0}
                width={W}
                height={H}
                rx="3"
                className={`${c.box} transition-[fill,stroke] duration-300`}
                strokeWidth={s === "active" || s === "added" ? 1.5 : 1}
                strokeDasharray={s === "removed" ? "4 3" : undefined}
              />
              <path
                d={glyphs[n.kind ?? "service"]}
                transform={`translate(${x0 + 11} ${p.y - 8})`}
                className={`fill-none stroke-current ${c.glyph}`}
                strokeWidth="1.25"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <text x={x0 + 35} y={n.sub ? p.y - 2 : p.y + 4} className={`${c.text} font-sans text-[14px]`}>
                {n.label}
              </text>
              {n.sub && (
                <text x={x0 + 35} y={p.y + 13} className="fill-muted font-mono text-[10.5px]">
                  {n.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function connections(d: ArchDiagram) {
  const name = new Map(d.nodes.map((n) => [n.id, n.label]));
  return (d.edges ?? []).map((e) => `${name.get(e.from)} ${e.both ? "↔" : "→"} ${name.get(e.to)}${e.label ? `: ${e.label}` : ""}`);
}

function Inside({ d }: { d: ArchDiagram }) {
  if (!d.groups?.length) return null;
  const name = new Map(d.nodes.map((n) => [n.id, n.label]));
  return (
    <ul className="list-disc pl-5">
      {d.groups.map((g) => (
        <li key={g.label}>
          Inside {g.label}: {g.nodes.map((id) => name.get(id)).join(", ")}
        </li>
      ))}
    </ul>
  );
}

const btn =
  "inline-flex h-8 items-center gap-1.5 border border-line px-3 text-[0.82rem] text-ink transition-colors hover:bg-paper-2 disabled:pointer-events-none disabled:opacity-40";

/**
 * An architecture diagram. With `steps`, readers can walk a request through it:
 * each step lights up its arrows (numbered by step) and shows a caption.
 */
export function Arch({
  title,
  nodes,
  edges = [],
  groups = [],
  steps,
  caption,
}: ArchDiagram & { title: string; steps?: ArchStep[]; caption?: ReactNode }) {
  const [step, setStep] = useState(-1);
  const { cols, rows } = bounds(nodes);
  const diagram = { nodes, edges, groups };

  const firstStep = new Map<string, number>();
  steps?.forEach((s, i) => s.edges?.forEach((e) => firstStep.has(e) || firstStep.set(e, i)));
  const nodesOf = (s: ArchStep) => s.nodes ?? (s.edges ?? []).flatMap((e) => e.split(">"));

  const walking = steps && step >= 0;
  const current = walking ? steps[step] : undefined;
  const activeEdges = new Set(current?.edges ?? []);
  const activeNodes = new Set(current ? nodesOf(current) : []);
  const seenEdges = new Set(walking ? steps.slice(0, step).flatMap((s) => s.edges ?? []) : []);
  const seenNodes = new Set(walking ? steps.slice(0, step).flatMap(nodesOf) : []);

  const state = (active: Set<string>, seen: Set<string>) => (id: string): State =>
    !walking ? "idle" : active.has(id) ? "active" : seen.has(id) ? "visited" : "dim";

  const footer = (
    <>
      {steps && (
        <div className="border-t border-line-soft px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {step < 0 ? (
              <button type="button" className={`${btn} border-ink bg-ink text-paper hover:bg-ink hover:opacity-85`} onClick={() => setStep(0)}>
                Walk through it <span aria-hidden>→</span>
              </button>
            ) : (
              <>
                <button type="button" className={btn} onClick={() => setStep(step - 1)} aria-label="Previous step">
                  <span aria-hidden>←</span> Back
                </button>
                <span className="px-1 font-mono text-[0.72rem] text-muted">
                  Step {step + 1} of {steps.length}
                </span>
                <button type="button" className={btn} onClick={() => setStep(step + 1)} disabled={step === steps.length - 1} aria-label="Next step">
                  Next <span aria-hidden>→</span>
                </button>
                <button type="button" className="ml-auto text-[0.8rem] text-muted underline decoration-line underline-offset-4 hover:text-ink" onClick={() => setStep(-1)}>
                  Show whole diagram
                </button>
              </>
            )}
          </div>
          <p className="mt-2.5 min-h-[1.5em] text-[0.92rem] leading-relaxed text-ink-2" aria-live="polite">
            {current ? (
              <>
                <span className="mr-2 font-mono text-[0.72rem] text-accent-ink">{step + 1}.</span>
                {current.caption}
              </>
            ) : (
              <span className="text-muted">{steps.length} steps. Use Next and Back to follow the request.</span>
            )}
          </p>
        </div>
      )}
      <TextVersion>
        {steps && (
          <ol className="list-decimal pl-5">
            {steps.map((s, i) => (
              <li key={i}>{s.caption}</li>
            ))}
          </ol>
        )}
        <Inside d={diagram} />
        <ul className="list-disc pl-5">
          {connections(diagram).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </TextVersion>
    </>
  );

  return (
    <Frame title={title} caption={caption} footer={footer}>
      <ArchCanvas
        diagram={diagram}
        title={title}
        cols={cols}
        rows={rows}
        nodeState={state(activeNodes, seenNodes)}
        edgeState={state(activeEdges, seenEdges)}
        badge={(id) => (walking && (activeEdges.has(id) || seenEdges.has(id)) ? firstStep.get(id)! + 1 : undefined)}
      />
    </Frame>
  );
}

/**
 * The same system before and after one change. What was added is worked out from the two diagrams
 * and drawn in the accent colour; what was removed is drawn dashed in red on the "before" side.
 */
export function Evolve({
  title,
  before,
  after,
  change,
  caption,
}: {
  title: string;
  before: ArchDiagram;
  after: ArchDiagram;
  /** One line naming the change, e.g. "Add a cache in front of the database". */
  change: ReactNode;
  caption?: ReactNode;
}) {
  const [side, setSide] = useState<"before" | "after">("before");
  const b = bounds([...before.nodes, ...after.nodes]);
  const beforeNodes = new Set(before.nodes.map((n) => n.id));
  const afterNodes = new Set(after.nodes.map((n) => n.id));
  const beforeEdges = new Set((before.edges ?? []).map(edgeId));
  const afterEdges = new Set((after.edges ?? []).map(edgeId));
  // Anything on this side that the other side lacks is the change.
  const diff = (other: Set<string>, mark: State) => (id: string): State => (other.has(id) ? "idle" : mark);

  const shown = side === "before" ? before : after;
  const name = new Map([...before.nodes, ...after.nodes].map((n) => [n.id, n.label]));
  const added = after.nodes.filter((n) => !beforeNodes.has(n.id)).map((n) => n.label);
  const removed = before.nodes.filter((n) => !afterNodes.has(n.id)).map((n) => n.label);
  const newEdges = (after.edges ?? []).filter((e) => !beforeEdges.has(edgeId(e)));

  const tab = (s: "before" | "after", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={side === s}
      onClick={() => setSide(s)}
      className={`h-8 px-3.5 text-[0.82rem] transition-colors ${side === s ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <Frame
      title={title}
      caption={caption}
      footer={
        <TextVersion>
          <p>Change: {change}</p>
          {added.length > 0 && <p>Added: {added.join(", ")}.</p>}
          {removed.length > 0 && <p>Removed: {removed.join(", ")}.</p>}
          {newEdges.length > 0 && (
            <p>
              New connections:{" "}
              {newEdges.map((e) => `${name.get(e.from)} → ${name.get(e.to)}${e.label ? ` (${e.label})` : ""}`).join("; ")}.
            </p>
          )}
        </TextVersion>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Before or after" className="inline-flex border border-line">
          {tab("before", "Before")}
          {tab("after", "After")}
        </div>
        <p className="text-[0.88rem] text-ink-2">
          <span className="mr-1.5 font-mono text-[0.65rem] tracking-[0.1em] text-accent-ink uppercase">Change</span>
          {change}
        </p>
      </div>
      <ArchCanvas
        diagram={shown}
        title={`${title}, ${side}`}
        cols={b.cols}
        rows={b.rows}
        nodeState={side === "before" ? diff(afterNodes, "removed") : diff(beforeNodes, "added")}
        edgeState={side === "before" ? diff(afterEdges, "removed") : diff(beforeEdges, "added")}
      />
    </Frame>
  );
}
