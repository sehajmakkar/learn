import fs from "node:fs/promises";
import path from "node:path";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GithubSlugger from "github-slugger";
import { courses, getCourse, lessonById, lessonsOf, type CourseLesson } from "@/lib/courses";
import type { Course } from "@/lib/courses/types";
import { CurriculumSidebar } from "@/components/lesson/sidebar";
import { Toc } from "@/components/lesson/toc";
import { MarkComplete } from "@/components/lesson/mark-complete";
import { CopyButton } from "@/components/lesson/copy-button";
import { L } from "@/components/lesson/diagrams";
import { Term } from "@/components/lesson/term";
import { editUrl, issueUrl } from "@/lib/site";

/** What each lesson's MDX file exports next to its content. */
type LessonMeta = {
  summary: string;
  uses?: string[]; // lesson ids this one builds on
  usedIn?: string[]; // lesson ids or project tags that build on this one
};

type LessonModule = { default: ComponentType<{ components?: Record<string, unknown> }>; meta: LessonMeta };

const tagLabel = { CODE: "with code", CONCEPT: "concept", BUILD: "build", DESIGN: "design", CASE: "case study" } as const;

// Every live lesson is prerendered below, so there's nothing to stream; let unknown slugs block and 404.
export const instant = false;

export function generateStaticParams() {
  return courses.flatMap((course) =>
    lessonsOf(course)
      .filter((l) => l.live)
      .map((l) => ({ course: course.id, slug: l.slug! })),
  );
}

function find(courseId: string, slug: string) {
  const course = getCourse(courseId);
  if (!course) return null;
  const lessons = lessonsOf(course);
  const index = lessons.findIndex((l) => l.slug === slug && l.live);
  return index === -1 ? null : { course, lessons, lesson: lessons[index], index };
}

async function load(course: string, slug: string) {
  return (await import(`@/content/${course}/${slug}.mdx`)) as LessonModule;
}

async function source(course: string, slug: string) {
  "use cache";
  return fs.readFile(path.join(process.cwd(), "content", course, `${slug}.mdx`), "utf8");
}

export async function generateMetadata({ params }: PageProps<"/[course]/[slug]">): Promise<Metadata> {
  const { course, slug } = await params;
  const found = find(course, slug);
  if (!found) return {};
  const { meta } = await load(course, slug);
  return { title: `${found.lesson.title} · ${found.course.title}`, description: meta.summary };
}

function titleFor(course: Course, id: string) {
  return lessonById(course, id)?.title ?? course.project?.steps.find((s) => s.tag === id)?.title ?? id;
}

function NeighbourCard({ course, l, dir }: { course: string; l?: CourseLesson; dir: "prev" | "next" }) {
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
    <Link href={`/${course}/${l.slug}`} className={`${cls} hover:bg-paper-2`}>
      {inner}
    </Link>
  ) : (
    <div className={`${cls} opacity-70`}>{inner}</div>
  );
}

export default async function LessonPage({ params }: PageProps<"/[course]/[slug]">) {
  const { course: courseId, slug } = await params;
  const found = find(courseId, slug);
  if (!found) notFound();
  const { course, lessons, lesson, index } = found;
  const prev = lessons[index - 1];
  const next = lessons[index + 1];

  const [{ default: Content, meta }, raw] = await Promise.all([load(course.id, slug), source(course.id, slug)]);
  // Lessons write <L id> and <Term t> without saying which course they're in.
  const components = {
    L: (props: { id: string; children?: ReactNode }) => <L {...props} course={course.id} />,
    Term: (props: { t: string; children?: ReactNode }) => <Term {...props} course={course.id} />,
  };
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
          <CurriculumSidebar course={course.id} current={lesson.id} />
        </div>
      </aside>

      <div className="min-w-0 px-5 pt-8 pb-24 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[680px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[0.82rem] text-muted">
            <Link href={`/${course.id}`} className="hover:text-ink">
              {course.title}
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
            <Content components={components} />
          </article>

          <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-line pt-8">
            <MarkComplete course={course.id} id={lesson.id} />
            <a
              href={issueUrl(`${lesson.id} ${lesson.title}`)}
              className="text-[0.85rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
            >
              Report a mistake
            </a>
            <a
              href={editUrl(`content/${course.id}/${slug}.mdx`)}
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
                      const target = lessonById(course, id);
                      return (
                        <li key={id} className="flex gap-3">
                          <span className="w-14 shrink-0 font-mono text-[0.75rem] text-muted">{id}</span>
                          {target?.live ? (
                            <Link href={`/${course.id}/${target.slug}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-current">
                              {target.title}
                            </Link>
                          ) : (
                            titleFor(course, id)
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
            <NeighbourCard course={course.id} l={prev} dir="prev" />
            <NeighbourCard course={course.id} l={next} dir="next" />
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
        <Link href={`/${course.id}#curriculum`}>☰ {lesson.module.title}</Link>
        <span>
          {lesson.id} · {index + 1}/{lessons.length}
        </span>
        {next?.live ? (
          <Link href={`/${course.id}/${next.slug}`} className="text-ink">
            next →
          </Link>
        ) : (
          <span className="opacity-60">next →</span>
        )}
      </div>
    </div>
  );
}
