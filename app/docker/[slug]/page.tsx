import fs from "node:fs/promises";
import path from "node:path";
import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GithubSlugger from "github-slugger";
import { allLessons, lessonById, projectSteps } from "@/lib/docker";
import { CurriculumSidebar } from "@/components/lesson/sidebar";
import { Toc } from "@/components/lesson/toc";
import { MarkComplete } from "@/components/lesson/mark-complete";
import { CopyButton } from "@/components/lesson/copy-button";
import { editUrl, issueUrl } from "@/lib/site";

/** What each lesson's MDX file exports next to its content. */
type LessonMeta = {
  summary: string;
  uses?: string[]; // lesson ids this one builds on
  usedIn?: string[]; // lesson ids or project tags that build on this one
};

type LessonModule = { default: ComponentType; meta: LessonMeta };

const tagLabel = { CODE: "with code", CONCEPT: "concept", BUILD: "build" } as const;

// Every live lesson is prerendered below, so there's nothing to stream; let unknown slugs block and 404.
export const instant = false;

export function generateStaticParams() {
  return allLessons.filter((l) => l.live).map((l) => ({ slug: l.slug! }));
}

function find(slug: string) {
  const index = allLessons.findIndex((l) => l.slug === slug && l.live);
  return index === -1 ? null : { lesson: allLessons[index], index };
}

async function load(slug: string) {
  return (await import(`@/content/docker/${slug}.mdx`)) as LessonModule;
}

async function source(slug: string) {
  "use cache";
  return fs.readFile(path.join(process.cwd(), "content/docker", `${slug}.mdx`), "utf8");
}

export async function generateMetadata({ params }: PageProps<"/docker/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = find(slug);
  if (!found) return {};
  const { meta } = await load(slug);
  return { title: `${found.lesson.title} · Docker`, description: meta.summary };
}

function titleFor(id: string) {
  return lessonById(id)?.title ?? projectSteps.find((s) => s.tag === id)?.title ?? id;
}

function NeighbourCard({ l, dir }: { l?: (typeof allLessons)[number]; dir: "prev" | "next" }) {
  if (!l) return <div />;
  const inner = (
    <>
      <span className="font-mono text-[0.65rem] tracking-[0.1em] text-muted uppercase">
        {dir === "prev" ? "← Previous" : "Next →"}
        {!l.live && " · being written"}
      </span>
      <span className="mt-1 block text-[0.95rem] text-ink">
        <span className="mr-2 font-mono text-[0.75rem] text-muted">{l.id}</span>
        {l.title}
      </span>
    </>
  );
  const cls = `block border border-line p-4 ${dir === "next" ? "text-right" : ""}`;
  return l.live ? (
    <Link href={`/docker/${l.slug}`} className={`${cls} hover:bg-paper-2`}>
      {inner}
    </Link>
  ) : (
    <div className={`${cls} opacity-70`}>{inner}</div>
  );
}

export default async function LessonPage({ params }: PageProps<"/docker/[slug]">) {
  const { slug } = await params;
  const found = find(slug);
  if (!found) notFound();
  const { lesson, index } = found;
  const prev = allLessons[index - 1];
  const next = allLessons[index + 1];

  const [{ default: Content, meta }, raw] = await Promise.all([load(slug), source(slug)]);
  // Same slugs rehype-slug gives the headings.
  const slugger = new GithubSlugger();
  const headings = [...raw.matchAll(/^## (.+)$/gm)].map(([, text]) => ({ id: slugger.slug(text), text }));
  const related = [
    ["Fundamentals you'll use", meta.uses ?? []],
    ["Used in", meta.usedIn ?? []],
  ] as const;

  return (
    <div className="mx-auto max-w-[1240px] lg:grid lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_210px]">
      <aside className="hidden border-r border-line lg:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-6">
          <CurriculumSidebar current={lesson.id} />
        </div>
      </aside>

      <div className="min-w-0 px-5 pt-8 pb-24 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[680px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[0.82rem] text-muted">
            <Link href="/docker" className="hover:text-ink">
              Docker
            </Link>
            <span>/</span>
            <span>
              {lesson.module.n} {lesson.module.title}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <CopyButton text={raw} label="COPY PAGE" />
            </div>
          </div>

          <header className="mt-8 border-b border-line pb-8">
            <p className="font-mono text-[0.72rem] tracking-[0.12em] text-muted uppercase">
              {lesson.id} · {lesson.tag ? `${tagLabel[lesson.tag]} · ` : ""}
              {lesson.minutes} min
            </p>
            <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.05] text-ink sm:text-[3.4rem]">{lesson.title}</h1>
            <p className="mt-4 text-[1.1rem] leading-relaxed text-ink-2">{meta.summary}</p>
          </header>

          <article className="prose-lesson mt-8">
            <Content />
          </article>

          <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-line pt-8">
            <MarkComplete id={lesson.id} />
            <a
              href={issueUrl(`${lesson.id} ${lesson.title}`)}
              className="text-[0.85rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
            >
              Report a mistake
            </a>
            <a
              href={editUrl(`content/docker/${slug}.mdx`)}
              className="text-[0.85rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
            >
              Edit this page
            </a>
          </div>

          {(meta.uses?.length || meta.usedIn?.length) && (
            <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
              {related.map(([h, ids]) => (
                <div key={h} className="bg-paper p-5">
                  <p className="font-mono text-[0.65rem] tracking-[0.12em] text-muted uppercase">{h}</p>
                  <ul className="mt-3 space-y-1.5 text-[0.92rem] text-ink-2">
                    {ids.map((id) => {
                      const target = lessonById(id);
                      return (
                        <li key={id} className="flex gap-3">
                          <span className="w-14 shrink-0 font-mono text-[0.75rem] text-muted">{id}</span>
                          {target?.live ? (
                            <Link href={`/docker/${target.slug}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-current">
                              {target.title}
                            </Link>
                          ) : (
                            titleFor(id)
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <NeighbourCard l={prev} dir="prev" />
            <NeighbourCard l={next} dir="next" />
          </div>
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-14 py-10 pr-4">
          <Toc items={headings} />
        </div>
      </aside>

      {/* Phone: keep position and navigation in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex h-12 items-center justify-between border-t border-line bg-paper/95 px-4 font-mono text-[0.72rem] text-muted backdrop-blur lg:hidden">
        <Link href="/docker#curriculum">☰ {lesson.module.title}</Link>
        <span>
          {lesson.id} · {index + 1}/{allLessons.length}
        </span>
        {next?.live ? (
          <Link href={`/docker/${next.slug}`} className="text-ink">
            next →
          </Link>
        ) : (
          <span className="opacity-60">next →</span>
        )}
      </div>
    </div>
  );
}
