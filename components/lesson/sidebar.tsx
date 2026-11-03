"use client";

import Link from "next/link";
import { useState } from "react";
import { getCourse, partsOf, statsOf } from "@/lib/courses";
import { useProgress } from "@/components/lesson/progress";

export function CurriculumSidebar({ course: courseId, current }: { course: string; current: string }) {
  const course = getCourse(courseId)!;
  const { done } = useProgress(courseId);
  const currentModule = current.slice(0, 2);
  const [open, setOpen] = useState<string[]>([currentModule]);
  const total = statsOf(course).lessons;

  return (
    <nav className="text-[0.86rem]" aria-label="Curriculum">
      <Link href={`/${course.id}`} className="mb-1 flex items-center gap-2 px-2 py-1.5 text-muted hover:text-ink">
        ← {course.title} overview
      </Link>
      <div className="mb-4 px-2">
        <div className="flex justify-between font-mono text-[0.65rem] text-muted">
          <span>PROGRESS</span>
          <span>
            {done.length}/{total}
          </span>
        </div>
        <div className="mt-1.5 h-1 bg-line">
          <div className="h-full bg-accent transition-all" style={{ width: `${(done.length / total) * 100}%` }} />
        </div>
      </div>
      {partsOf(course).map((part) => (
        <div key={part.id} className="mb-3">
          {part.title && (
            <p className="mt-4 mb-1 px-2 font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase">{part.title}</p>
          )}
          <ul className="space-y-0.5">
            {part.modules.map((m) => {
              const isOpen = open.includes(m.n);
              return (
                <li key={m.n}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? open.filter((x) => x !== m.n) : [...open, m.n])}
                    className="flex w-full items-center gap-2.5 px-2 py-1.5 text-left text-ink-2 hover:text-ink"
                    aria-expanded={isOpen}
                  >
                    <span className="font-mono text-[0.68rem] text-muted">{m.n}</span>
                    <span className="flex-1">{m.title}</span>
                    <span className={`text-[0.6rem] text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}>▸</span>
                  </button>
                  {isOpen && (
                    <ul className="mb-2 ml-[1.15rem] border-l border-line">
                      {m.lessons.map((lesson) => {
                        const active = lesson.id === current;
                        const isDone = done.includes(lesson.id);
                        const row = (
                          <>
                            <span
                              className={`size-[7px] shrink-0 ${isDone ? "bg-accent" : active ? "border border-accent" : "border border-line"}`}
                            />
                            <span className="flex-1 leading-snug">{lesson.title}</span>
                          </>
                        );
                        const base = "-ml-px flex items-center gap-2.5 border-l py-1.5 pr-2 pl-3";
                        return (
                          <li key={lesson.id}>
                            {lesson.live ? (
                              <Link
                                href={`/${course.id}/${lesson.slug}`}
                                className={`${base} ${active ? "border-ink bg-paper-2 text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
                                aria-current={active ? "page" : undefined}
                              >
                                {row}
                              </Link>
                            ) : (
                              <span className={`${base} border-transparent text-muted/80`} title="Being written">
                                {row}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
