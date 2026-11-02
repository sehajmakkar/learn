"use client";

// Step-through diagram for 02.02: how one changed file invalidates the layers above it,
// and how reordering the Dockerfile fixes that.
import { useState } from "react";

type State = "run" | "cached" | "changed" | "rerun";
type Layer = { cmd: string; state: State; time: string };
type Step = { caption: string; file: "before" | "after"; layers: Layer[]; total: string };

const before = ["FROM node:22-slim", "WORKDIR /app", "COPY . .", "RUN npm ci", 'CMD ["node", "src/index.js"]'];
const after = [
  "FROM node:22-slim",
  "WORKDIR /app",
  "COPY package.json package-lock.json ./",
  "RUN npm ci",
  "COPY . .",
  'CMD ["node", "src/index.js"]',
];

const mk = (cmds: string[], states: State[], times: string[]): Layer[] =>
  cmds.map((cmd, i) => ({ cmd, state: states[i], time: times[i] }));

const steps: Step[] = [
  {
    caption: "First build. Every step runs. Installing dependencies is the slow one.",
    file: "before",
    layers: mk(before, ["run", "run", "run", "run", "run"], ["pull", "0.1s", "0.4s", "41s", "0s"]),
    total: "~42s",
  },
  {
    caption: "You change one line in src/index.js. COPY . . checksums the files it copies, sees a difference, and misses the cache.",
    file: "before",
    layers: mk(before, ["cached", "cached", "changed", "rerun", "rerun"], ["cached", "cached", "0.4s", "", ""]),
    total: "…",
  },
  {
    caption: "A miss invalidates every step after it. npm ci runs again: 41 seconds for a one-line change.",
    file: "before",
    layers: mk(before, ["cached", "cached", "changed", "rerun", "rerun"], ["cached", "cached", "0.4s", "41s", "0s"]),
    total: "~42s",
  },
  {
    caption: "Reorder: copy only the files npm ci needs, install, then copy the rest of the source.",
    file: "after",
    layers: mk(after, ["run", "run", "run", "run", "run", "run"], ["pull", "0.1s", "0.1s", "41s", "0.4s", "0s"]),
    total: "~42s once",
  },
  {
    caption: "Same one-line edit. Only the final COPY misses; the dependency layer is reused.",
    file: "after",
    layers: mk(after, ["cached", "cached", "cached", "cached", "changed", "rerun"], ["cached", "cached", "cached", "cached", "0.4s", "0s"]),
    total: "<1s",
  },
];

const style: Record<State, { box: string; badge: string; label: string }> = {
  run: { box: "border-line bg-paper-2", badge: "text-muted", label: "RUN" },
  cached: { box: "border-line bg-transparent text-muted", badge: "text-accent-ink", label: "CACHED" },
  changed: { box: "border-danger bg-danger-soft/70", badge: "text-danger", label: "CHANGED" },
  rerun: { box: "border-danger/50 border-dashed bg-danger-soft/30", badge: "text-danger", label: "REBUILD" },
};

export function LayerCacheSteps() {
  const [i, setI] = useState(0);
  const [all, setAll] = useState(false);
  const [text, setText] = useState(false);
  const shown = all ? steps : [steps[i]];

  return (
    <figure className="not-prose my-10 border border-line">
      <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
        <span className="font-mono text-[0.68rem] tracking-[0.12em] text-muted uppercase">
          How the cache breaks {all ? "" : `· step ${i + 1} / ${steps.length}`}
        </span>
        <button type="button" onClick={() => setText(!text)} className="font-mono text-[0.68rem] text-muted hover:text-ink">
          {text ? "DIAGRAM" : "TEXT VERSION"}
        </button>
      </div>

      {text ? (
        <ol className="list-decimal space-y-2 py-5 pr-5 pl-10 text-[0.95rem] leading-relaxed text-ink-2">
          {steps.map((s) => (
            <li key={s.caption}>{s.caption}</li>
          ))}
        </ol>
      ) : (
        <div className="divide-y divide-line-soft">
          {shown.map((s) => (
            <div key={s.caption} className="px-5 py-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[0.7rem] text-muted">
                  Dockerfile · {s.file === "before" ? "source copied first" : "dependencies first"}
                </span>
                <span className="font-mono text-[0.7rem] text-ink">build {s.total}</span>
              </div>
              {/* Layers stack bottom-up, like the image. */}
              <ol className="mt-3 flex flex-col-reverse gap-1.5">
                {s.layers.map((layer) => (
                  <li
                    key={layer.cmd}
                    className={`flex items-center gap-3 border px-3 py-2 font-mono text-[0.78rem] transition-colors duration-300 ${style[layer.state].box}`}
                  >
                    <span className="flex-1 truncate">{layer.cmd}</span>
                    <span className={`text-[0.62rem] tracking-[0.08em] ${style[layer.state].badge}`}>{style[layer.state].label}</span>
                    <span className="w-12 text-right text-[0.68rem] text-muted">{layer.time}</span>
                  </li>
                ))}
              </ol>
              <figcaption className="mt-3 text-[0.93rem] leading-relaxed text-ink-2">{s.caption}</figcaption>
            </div>
          ))}
        </div>
      )}

      {!text && (
        <div className="flex items-center gap-2 border-t border-line px-5 py-3">
          {!all && (
            <>
              <button
                type="button"
                disabled={i === 0}
                onClick={() => setI(i - 1)}
                className="h-8 border border-line px-3 text-[0.85rem] text-ink disabled:opacity-30"
              >
                Back
              </button>
              <button
                type="button"
                disabled={i === steps.length - 1}
                onClick={() => setI(i + 1)}
                className="h-8 bg-ink px-3 text-[0.85rem] text-paper disabled:opacity-30"
              >
                Next step
              </button>
              <div className="ml-2 flex gap-1">
                {steps.map((_, n) => (
                  <span key={n} className={`h-1 w-4 ${n <= i ? "bg-accent" : "bg-line"}`} />
                ))}
              </div>
            </>
          )}
          <button type="button" onClick={() => setAll(!all)} className="ml-auto font-mono text-[0.68rem] text-muted hover:text-ink">
            {all ? "ONE AT A TIME" : "SHOW ALL"}
          </button>
        </div>
      )}
      <p className="border-t border-line-soft px-5 py-2 font-mono text-[0.62rem] text-muted">Timings are illustrative.</p>
    </figure>
  );
}
