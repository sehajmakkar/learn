"use client";

import { useSyncExternalStore } from "react";

// Lists of ids saved in this browser only (completed lessons, practised questions). No account needed.
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: string[] }>();
const empty: string[] = [];

function snapshot(key: string) {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value: string[] = [];
  try {
    value = raw ? JSON.parse(raw) : [];
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

export function useStoredList(key: string) {
  const items = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot(key),
    () => empty,
  );
  const toggle = (id: string) => {
    const next = items.includes(id) ? items.filter((x) => x !== id) : [...items, id];
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
    listeners.forEach((l) => l());
  };
  return { items, toggle };
}

/** Docker keeps its original keys so nobody's saved progress resets. */
export const storageKey = (kind: "progress" | "interview-practised", course: string) =>
  course === "docker" ? `learn:${kind}` : `learn:${kind}:${course}`;

export function useProgress(course: string) {
  const { items, toggle } = useStoredList(storageKey("progress", course));
  return { done: items, toggle };
}
