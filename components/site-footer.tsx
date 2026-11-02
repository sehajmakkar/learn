import Link from "next/link";
import { repo } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="hatch h-8 border-b border-line" />
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-8 text-[0.85rem] text-muted sm:flex-row sm:items-center sm:px-6">
        <p>
          Written in public by{" "}
          <a href="https://sehaj.tech" className="text-ink underline decoration-line underline-offset-4">
            Sehaj
          </a>
          . Free and open source.
        </p>
        <div className="flex gap-5 font-mono text-[0.75rem] sm:ml-auto">
          <Link href="/" className="hover:text-ink">
            LIBRARY
          </Link>
          <a href="https://x.com/kryptokodes" className="hover:text-ink">
            X
          </a>
          <a href={repo} className="hover:text-ink">
            GITHUB
          </a>
        </div>
      </div>
    </footer>
  );
}
