"use client";

// ⌘K search across every course: lessons, their sections, interview questions and glossary terms.
// The index is a static file fetched the first time search opens.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchEntry, SearchKind } from "@/lib/search";

const kindLabel: Record<SearchKind, string> = {
  course: "Course",
  lesson: "Lesson",
  upcoming: "Soon",
  section: "Section",
  question: "Interview",
  term: "Term",
};
const kindBonus: Record<SearchKind, number> = { course: 3, lesson: 2, term: 1.5, section: 1, question: 0.5, upcoming: 0.25 };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function score(e: SearchEntry, terms: string[]) {
  const title = e.title.toLowerCase();
  const where = e.where.toLowerCase();
  const text = (e.text ?? "").toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (title.startsWith(t)) s += 6;
    else if (new RegExp(`\\b${escape(t)}`).test(title)) s += 4;
    else if (title.includes(t)) s += 2;
    else if (where.includes(t)) s += 1;
    else if (text.includes(t)) s += 0.5;
    else return 0;
  }
  return s + kindBonus[e.kind];
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map(escape).join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    i % 2 ? (
      <mark key={i} className="bg-transparent text-accent-ink underline decoration-accent/50 underline-offset-2">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

let indexPromise: Promise<SearchEntry[]> | null = null;
const loadIndex = () =>
  (indexPromise ??= fetch("/search.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .catch((e) => {
      indexPromise = null;
      throw e;
    }));

export function Search() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const show = () => {
    setOpen(true);
    setFailed(false);
    loadIndex().then(setIndex, () => setFailed(true));
  };
  const hide = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  // ⌘K / Ctrl+K anywhere, or "/" when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchEntry[] = !index
    ? []
    : terms.length
      ? index
          .map((e) => ({ e, s: score(e, terms) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, 40)
          .map((x) => x.e)
      : index.filter((e) => e.kind === "course");

  const go = (e: SearchEntry | undefined) => {
    if (!e) return;
    hide();
    router.push(e.href);
  };

  const move = (to: number) => {
    const n = Math.max(0, Math.min(results.length - 1, to));
    setActive(n);
    list.current?.children[n]?.scrollIntoView({ block: "nearest" });
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search"
        className="flex h-8 items-center gap-2 rounded-md border border-line px-2 text-[0.8rem] text-muted transition-colors hover:text-ink md:px-2.5"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden rounded border border-line px-1 font-mono text-[0.65rem] md:inline">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-3 pt-[10vh] backdrop-blur-[2px]" onMouseDown={hide}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="flex max-h-[75vh] w-full max-w-[620px] flex-col border border-line bg-paper shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  const keys: Record<string, () => void> = {
                    ArrowDown: () => move(active + 1),
                    ArrowUp: () => move(active - 1),
                    Enter: () => go(results[active]),
                    Escape: hide,
                  };
                  if (keys[e.key]) {
                    e.preventDefault();
                    keys[e.key]();
                  }
                }}
                placeholder="Search lessons, sections, interview questions, terms…"
                className="h-13 flex-1 bg-transparent text-[0.98rem] text-ink outline-none placeholder:text-muted"
                role="combobox"
                aria-expanded="true"
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `search-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={hide} className="rounded border border-line px-1.5 font-mono text-[0.65rem] text-muted hover:text-ink">
                ESC
              </button>
            </div>

            <ul ref={list} id="search-results" role="listbox" className="flex-1 overflow-y-auto py-1.5">
              {failed && <li className="px-4 py-6 text-center text-[0.9rem] text-danger">Couldn&apos;t load the search index. Check your connection and try again.</li>}
              {!failed && !index && <li className="px-4 py-6 text-center font-mono text-[0.75rem] text-muted">Loading…</li>}
              {index && terms.length > 0 && results.length === 0 && (
                <li className="px-4 py-6 text-center text-[0.9rem] text-muted">Nothing matches “{query}”.</li>
              )}
              {results.map((e, i) => (
                <li
                  key={`${e.kind}:${e.href}:${e.title}`}
                  id={`search-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => i !== active && setActive(i)}
                  onClick={() => go(e)}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${i === active ? "bg-paper-2" : ""}`}
                >
                  <span
                    className={`mt-0.5 w-[4.6rem] shrink-0 font-mono text-[0.6rem] tracking-[0.08em] uppercase ${i === active ? "text-accent-ink" : "text-muted"}`}
                  >
                    {kindLabel[e.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.93rem] text-ink">
                      <Highlight text={e.title} terms={terms} />
                    </span>
                    <span className="block truncate font-mono text-[0.68rem] text-muted">{e.where}</span>
                  </span>
                  {i === active && <span className="mt-0.5 font-mono text-[0.7rem] text-muted" aria-hidden>↵</span>}
                </li>
              ))}
            </ul>

            <div className="flex gap-4 border-t border-line px-4 py-2 font-mono text-[0.62rem] text-muted">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>esc close</span>
              {index && <span className="ml-auto">{terms.length ? `${results.length}${results.length === 40 ? "+" : ""} results` : "Type to search"}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
