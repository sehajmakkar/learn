"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import { QuestionMeta } from "@/components/interview";
import { lessonById } from "@/lib/docker";
import {
  bank,
  frequencyDots,
  levelOrder,
  SOURCE_COUNT,
  sources,
  topics,
  type BankQuestion,
  type Topic,
} from "@/lib/interview-bank";

// Which questions this browser has marked as practised. No account needed.
const KEY = "learn:interview-practised";
const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cache: string[] = [];
function snapshot() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? JSON.parse(raw) : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}
const empty: string[] = [];
function usePractised() {
  const done = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    () => empty,
  );
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    listeners.forEach((l) => l());
  };
  return { done, toggle };
}

/** Renders `backticks` as inline code. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="border border-line bg-paper px-1 py-px font-mono text-[0.85em] text-ink">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function seenLabel(q: BankQuestion) {
  return q.pick ? `${q.seenIn.length}/${SOURCE_COUNT} guides · our pick` : `${q.seenIn.length}/${SOURCE_COUNT} guides`;
}

function QuestionCard({
  q,
  n,
  practised,
  onPractised,
  defaultOpen,
}: {
  q: BankQuestion;
  n: number;
  practised: boolean;
  onPractised: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const lesson = q.lesson ? lessonById(q.lesson) : undefined;
  const meta = { ...q, frequency: frequencyDots(q) as 1 | 2 | 3 | 4 };
  return (
    <li id={q.id} className={`border bg-paper-2 ${practised ? "border-accent/50" : "border-line"} scroll-mt-20 sm:scroll-mt-56`}>
      <div className="flex gap-4 p-5">
        <span className="pt-0.5 font-mono text-[0.72rem] text-muted">{String(n).padStart(2, "0")}</span>
        <div className="flex-1">
          <QuestionMeta
            q={meta}
            freq={seenLabel(q)}
            freqTitle={`Included in ${q.seenIn.map((s) => sources[s].name).join(", ")}`}
          />
          <p className="mt-2.5 text-[1.05rem] leading-snug text-ink">
            <Rich text={q.q} />
          </p>
          <p className="mt-1.5 font-mono text-[0.65rem] tracking-[0.08em] text-muted uppercase">{q.topic}</p>
        </div>
      </div>
      {open ? (
        <div className="border-t border-line px-5 py-5 sm:pl-14">
          <p className="mb-2 font-mono text-[0.68rem] tracking-[0.1em] text-muted uppercase">Model answer</p>
          <div className="space-y-3 text-[0.97rem] leading-relaxed text-ink-2">
            {q.answer.map((p, i) => (
              <p key={i}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          {q.followUps && q.followUps.length > 0 && (
            <div className="mt-5 border-t border-dashed border-line pt-4 text-[0.95rem] text-ink-2">
              <p className="mb-2 font-mono text-[0.68rem] tracking-[0.1em] text-muted uppercase">Likely follow-ups</p>
              <ul className="space-y-1.5">
                {q.followUps.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-muted">→</span>
                    <Rich text={f} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-ink">
              <input type="checkbox" checked={practised} onChange={onPractised} className="size-4 accent-[var(--accent)]" />
              I can answer this
            </label>
            {lesson?.live && (
              <Link href={`/docker/${lesson.slug}`} className="font-mono text-[0.72rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">
                Learn it: {lesson.id} {lesson.title} →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between border-t border-line px-5 py-3 text-left text-[0.9rem] text-muted transition-colors hover:bg-paper hover:text-ink sm:pl-14"
        >
          <span>Say your answer out loud, then reveal.</span>
          <span className="font-mono text-[0.75rem]">REVEAL ↓</span>
        </button>
      )}
    </li>
  );
}

type Sort = "asked" | "course";

export function InterviewBank() {
  const { done, toggle } = usePractised();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<BankQuestion["level"] | "All">("All");
  const [topic, setTopic] = useState<Topic | "All">("All");
  const [mustOnly, setMustOnly] = useState(false);
  const [hidePractised, setHidePractised] = useState(false);
  const [sort, setSort] = useState<Sort>("asked");
  const [random, setRandom] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = bank.filter(
      (q) =>
        (level === "All" || q.level === level) &&
        (topic === "All" || q.topic === topic) &&
        (!mustOnly || q.importance === "Must-know") &&
        (!hidePractised || !done.includes(q.id)) &&
        (!needle || `${q.q} ${q.answer.join(" ")} ${q.topic}`.toLowerCase().includes(needle)),
    );
    const courseIndex = (q: BankQuestion) => (q.lesson ? q.lesson : "99");
    return [...filtered].sort((a, b) =>
      sort === "asked"
        ? b.seenIn.length - a.seenIn.length || levelOrder[a.level] - levelOrder[b.level]
        : courseIndex(a).localeCompare(courseIndex(b)),
    );
  }, [query, level, topic, mustOnly, hidePractised, done, sort]);

  const pickRandom = () => {
    const pool = list.length ? list : bank;
    const q = pool[Math.floor(Math.random() * pool.length)];
    setRandom(q.id);
    requestAnimationFrame(() => document.getElementById(q.id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const chip = (active: boolean) =>
    `h-8 border px-3 text-[0.82rem] transition-colors ${active ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:text-ink"}`;

  return (
    <div>
      {/* Sticky only where there's room: on a phone the filters would cover a fifth of the screen. */}
      <div className="-mx-5 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:sticky sm:top-14 sm:z-20 sm:-mx-10 sm:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions and answers"
            className="h-9 min-w-0 flex-1 border border-line bg-paper-2 px-3 text-[0.9rem] text-ink outline-none placeholder:text-muted focus:border-ink sm:max-w-xs"
          />
          <button type="button" onClick={pickRandom} className="h-9 border border-line px-3 text-[0.85rem] text-ink hover:bg-paper-2">
            Random question
          </button>
          <span className="ml-auto font-mono text-[0.7rem] text-muted">
            {done.length}/{bank.length} PRACTISED
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {(["All", "Junior", "Mid", "Senior"] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLevel(l)} className={chip(level === l)}>
              {l}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-line" />
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value as Topic | "All")}
            className="h-8 border border-line bg-paper-2 px-2 text-[0.82rem] text-ink"
            aria-label="Topic"
          >
            <option value="All">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-8 border border-line bg-paper-2 px-2 text-[0.82rem] text-ink"
            aria-label="Sort"
          >
            <option value="asked">Most asked first</option>
            <option value="course">Course order</option>
          </select>
          <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-[0.82rem] text-ink-2">
            <input type="checkbox" checked={mustOnly} onChange={(e) => setMustOnly(e.target.checked)} className="accent-[var(--accent)]" />
            Must-know only
          </label>
          <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-[0.82rem] text-ink-2">
            <input type="checkbox" checked={hidePractised} onChange={(e) => setHidePractised(e.target.checked)} className="accent-[var(--accent)]" />
            Hide practised
          </label>
        </div>
      </div>

      <p className="mt-5 font-mono text-[0.7rem] text-muted">
        {list.length} OF {bank.length} QUESTIONS
      </p>
      {list.length === 0 ? (
        <p className="mt-6 text-[0.95rem] text-muted">No questions match. Try clearing a filter.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {list.map((q, i) => (
            <QuestionCard
              key={`${q.id}-${random === q.id ? "r" : ""}`}
              q={q}
              n={i + 1}
              practised={done.includes(q.id)}
              onPractised={() => toggle(q.id)}
              defaultOpen={false}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
