"use client";

import { useSyncExternalStore } from "react";

// Lesson progress lives in this browser only. No account needed.
const KEY = "learn:progress";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

let cache: string[] | null = null;
let cacheRaw: string | null = null;
function snapshot() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (cache === null || raw !== cacheRaw) {
    cacheRaw = raw;
    cache = read();
  }
  return cache;
}

const empty: string[] = [];

export function useProgress() {
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
