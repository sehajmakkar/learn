import Link from "next/link";
import { siDocker, siGit, siKubernetes, siLinux, siPostgresql, siRedis } from "simple-icons";
import { CreationHero } from "@/components/creation-hero";
import { HatchBand, PenNote, SectionLabel } from "@/components/blueprint";
import { publishedCourses, statsOf } from "@/lib/courses";

const icons = [siDocker, siKubernetes, siRedis, siPostgresql, siGit, siLinux];
const logos = icons.map((i) => ({ title: i.title, hex: i.hex, path: i.path }));

type Topic = { icon: { title: string; hex: string; path: string }; href?: string; status: string; meta: string };

const topics: Topic[] = [
  ...publishedCourses.map((c) => {
    const s = statsOf(c);
    return {
      icon: { ...c.logo, title: c.title },
      href: `/${c.id}`,
      status: c.status === "live" ? "Live" : "Writing",
      meta:
        c.status === "live" ? `${s.modules} modules · ${s.lessons} lessons` : `${s.modules} modules · ${s.live} live`,
    };
  }),
  ...[siKubernetes, siRedis, siPostgresql, siGit, siLinux].map((icon, i) => ({
    icon,
    status: i === 0 ? "Next" : "Planned",
    meta: "Planned",
  })),
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
        <CreationHero logos={logos} />
      </section>

      <div className="mx-auto max-w-[880px] border-x border-line">
        <section className="rule-bleed relative px-5 pt-12 pb-14 sm:px-10">
          <PenNote className="absolute top-8 -left-40 hidden xl:flex">replaces hours of video</PenNote>
          <h1 className="font-serif text-[2.75rem] leading-[1.02] text-ink sm:text-[4rem]">
            Learn one thing <em className="text-accent-ink">properly</em>.
          </h1>
          <p className="mt-5 max-w-[560px] text-[1.075rem] leading-relaxed text-ink-2">
            Free courses that take a technology from first principles to production. Written to be read side by side
            with a terminal, with quizzes along the way, a real project at the end and an interview bank.
          </p>
        </section>

        <HatchBand />
        <SectionLabel>Library</SectionLabel>

        <ul className="grid grid-cols-2 border-t border-line sm:grid-cols-3">
          {topics.map(({ icon, href, status, meta }) => {
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill={href ? `#${icon.hex}` : "currentColor"} className={href ? "" : "text-muted opacity-60"} aria-hidden>
                    <path d={icon.path} />
                  </svg>
                  <span className={`font-mono text-[0.62rem] tracking-[0.1em] uppercase ${status === "Live" || status === "Writing" ? "text-accent-ink" : "text-muted"}`}>
                    {(status === "Live" || status === "Writing") && <span className="mr-1.5 inline-block size-1.5 rounded-full bg-accent" />}
                    {status}
                  </span>
                </div>
                <h2 className={`mt-6 font-serif text-[1.6rem] leading-none ${href ? "text-ink" : "text-ink-2"}`}>{icon.title}</h2>
                <p className="mt-1.5 font-mono text-[0.68rem] text-muted">{meta}</p>
              </>
            );
            const cls = "block h-full p-5 sm:p-6";
            return (
              <li key={icon.title} className="border-b border-line not-[:nth-child(2n)]:border-r sm:not-[:nth-child(2n)]:border-r-0 sm:not-[:nth-child(3n)]:border-r">
                {href ? (
                  <Link href={href} className={`${cls} transition-colors hover:bg-paper-2`}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
