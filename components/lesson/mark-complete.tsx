"use client";

import { useProgress } from "@/components/lesson/progress";

export function MarkComplete({ course, id }: { course: string; id: string }) {
  const { done, toggle } = useProgress(course);
  const isDone = done.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      className={`inline-flex h-10 items-center gap-2.5 border px-4 text-[0.9rem] transition-colors ${
        isDone ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink hover:bg-paper-2"
      }`}
    >
      <span className={`size-2.5 ${isDone ? "bg-accent" : "border border-current"}`} />
      {isDone ? "Completed" : "Mark lesson complete"}
    </button>
  );
}
