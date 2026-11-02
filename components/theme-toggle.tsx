"use client";

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => {
        const dark = document.documentElement.classList.toggle("dark");
        try {
          localStorage.setItem("theme", dark ? "dark" : "light");
        } catch {}
      }}
      className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:text-ink"
      aria-label="Toggle colour theme"
    >
      {/* Half-filled circle reads as "theme" in both modes, so no mount check is needed. */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
      </svg>
    </button>
  );
}
