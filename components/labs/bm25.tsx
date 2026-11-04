"use client";

// Ranking ten Snip link titles for a query, three ways: by how often the words appear, by TF-IDF, and by BM25 with
// adjustable k1 and b. Small enough to check by hand.
import { useState } from "react";

const DOCS = [
  "Summer sale: shoes and sandals up to 50% off",
  "Summer camp registration for kids",
  "Running shoes buyer's guide",
  "Winter sale on boots and coats",
  "How to clean white shoes",
  "Summer festival tickets",
  "Shoes, shoes, shoes: the ultimate shoe collection, with shoes for every day of the week and every occasion",
  "Sale ends tonight",
  "Company summer party photos",
  "Kids' shoes: back-to-school sale",
];

const STOP = new Set(["a", "an", "and", "the", "to", "for", "of", "on", "up", "how", "with", "every", "s", "off"]);

/** Lowercase, split on anything that isn't a letter or digit, drop stop words, strip a plural "s". */
export function analyze(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOP.has(t))
    .map((t) => (t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t));
}

const TOKENS = DOCS.map(analyze);
const N = DOCS.length;
const AVG = TOKENS.reduce((s, t) => s + t.length, 0) / N;
const df = (term: string) => TOKENS.filter((t) => t.includes(term)).length;

type Mode = "count" | "tfidf" | "bm25";

export function score(mode: Mode, query: string[], doc: string[], k1: number, b: number) {
  let total = 0;
  for (const term of new Set(query)) {
    const tf = doc.filter((t) => t === term).length;
    if (tf === 0) continue;
    const n = df(term);
    if (mode === "count") total += tf;
    else if (mode === "tfidf") total += tf * Math.log(N / n);
    else {
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      total += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / AVG)));
    }
  }
  return total;
}

const MODES: [Mode, string][] = [
  ["count", "Count matches"],
  ["tfidf", "TF-IDF"],
  ["bm25", "BM25"],
];

export function Bm25Lab({ preset }: { preset?: { query?: string; mode?: Mode } }) {
  const [query, setQuery] = useState(preset?.query ?? "summer shoes");
  const [mode, setMode] = useState<Mode>(preset?.mode ?? "count");
  const [k1, setK1] = useState(1.2);
  const [b, setB] = useState(0.75);
  const q = analyze(query);
  const ranked = DOCS.map((title, i) => ({ title, i, s: score(mode, q, TOKENS[i], k1, b) }))
    .filter((d) => d.s > 0)
    .sort((x, y) => y.s - x.s || x.i - y.i);
  const max = ranked[0]?.s ?? 1;

  const pill = (active: boolean) =>
    `border px-2.5 py-1 font-mono text-[0.75rem] ${active ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:border-ink-2"}`;

  return (
    <div>
      <label className="block">
        <span className="text-[0.85rem] text-ink-2">Query</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1.5 w-full border border-line bg-paper px-3 py-2 font-mono text-[0.85rem] text-ink outline-none focus:border-ink-2"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["summer shoes", "shoes", "sale", "kids shoes sale"].map((p) => (
          <button key={p} type="button" onClick={() => setQuery(p)} className={pill(query === p)}>
            {p}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-[0.68rem] text-muted">Terms after analysis: {q.length ? q.join(", ") : "none"}</p>

      <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Scoring">
        {MODES.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={pill(mode === id)}>
            {label}
          </button>
        ))}
      </div>

      <div className={`mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 ${mode === "bm25" ? "" : "opacity-40"}`}>
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            k1: how fast repeats stop counting
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">{k1.toFixed(1)}</span>
          </span>
          <input type="range" min={0} max={3} step={0.1} value={k1} disabled={mode !== "bm25"} onChange={(e) => setK1(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--accent)]" />
        </label>
        <label className="block">
          <span className="flex items-baseline justify-between text-[0.85rem] text-ink-2">
            b: how much long titles are penalised
            <span className="font-mono text-[0.82rem] text-ink tabular-nums">{b.toFixed(2)}</span>
          </span>
          <input type="range" min={0} max={1} step={0.05} value={b} disabled={mode !== "bm25"} onChange={(e) => setB(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--accent)]" />
        </label>
      </div>

      <ol className="mt-5 space-y-2">
        {ranked.length === 0 && <li className="text-[0.85rem] text-muted">No title contains these terms.</li>}
        {ranked.map((d, rank) => (
          <li key={d.i} className="grid grid-cols-[1.5rem_1fr_4rem] items-center gap-3 text-[0.82rem]">
            <span className="font-mono text-muted">{rank + 1}</span>
            <span>
              <span className="block text-ink">{d.title}</span>
              <span className="mt-1 block h-1.5 bg-paper-2">
                <span className="block h-full bg-[var(--accent)]" style={{ width: `${Math.round((d.s / max) * 100)}%` }} />
              </span>
            </span>
            <span className="text-right font-mono text-[0.75rem] text-ink tabular-nums">{d.s.toFixed(2)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 font-mono text-[0.68rem] text-muted">
        {N} titles, average length {AVG.toFixed(1)} terms after analysis.
      </p>
    </div>
  );
}
