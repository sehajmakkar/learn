import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { publishedCourses } from "@/lib/courses";
import { repo } from "@/lib/site";

const nav = [{ href: "/", label: "Library" }, ...publishedCourses.map((c) => ({ href: `/${c.id}`, label: c.title }))];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-0.5" aria-label="sehaj/learn home">
          <span className="font-serif text-[1.45rem] leading-none text-ink">sehaj</span>
          <span className="font-mono text-[0.8rem] text-muted">/learn</span>
        </Link>

        <nav className="hidden items-center gap-5 text-[0.9rem] text-muted sm:flex">
          {nav.map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="hidden h-8 items-center gap-2 rounded-md border border-line px-2.5 text-[0.8rem] text-muted transition-colors hover:text-ink md:flex"
            title="Search arrives with the content pipeline"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            Search
            <kbd className="rounded border border-line px-1 font-mono text-[0.65rem]">⌘K</kbd>
          </button>
          <a
            href={repo}
            className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:text-ink"
            aria-label="Source on GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.3v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
