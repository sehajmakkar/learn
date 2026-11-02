"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex h-7 items-center gap-1.5 rounded px-2 font-mono text-[0.68rem] text-muted transition-colors hover:bg-paper hover:text-ink"
      aria-label={label ?? "Copy"}
    >
      {copied ? (
        <span className="text-accent-ink">COPIED</span>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="9" y="9" width="12" height="12" rx="1" />
            <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
          </svg>
          {label ?? "COPY"}
        </>
      )}
    </button>
  );
}
