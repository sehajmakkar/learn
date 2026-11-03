import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CreationHero } from "@/components/creation-hero";
import { Dimension, HatchBand, PenNote, SectionLabel } from "@/components/blueprint";
import { QuestionMeta } from "@/components/interview";
import { getCourse, lessonsOf, partsOf, publishedCourses, statsOf } from "@/lib/courses";
import { getBank } from "@/lib/interview";
import { frequencyDots } from "@/lib/interview/types";

// Every course page is prerendered; unknown courses 404.
export const instant = false;

export function generateStaticParams() {
  return publishedCourses.map((c) => ({ course: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[course]">): Promise<Metadata> {
  const course = getCourse((await params).course);
  return course ? course.meta : {};
}

export default async function CoursePage({ params }: PageProps<"/[course]">) {
  const course = getCourse((await params).course);
  if (!course || course.status === "planned") notFound();

  const stats = statsOf(course);
  const first = lessonsOf(course).find((x) => x.live);
  const bank = getBank(course.id);
  const sourceCount = bank ? Object.keys(bank.sources).length : 0;
  const mostAsked = bank ? [...bank.questions].sort((a, b) => b.seenIn.length - a.seenIn.length).slice(0, 5) : [];
  const [before, emphasis, after] = course.headline;

  return (
    <>
      <section className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
        <Dimension className="mx-auto mb-4 max-w-[880px]">
          {stats.modules} modules · {stats.lessons} lessons · ~{stats.hours} hrs
          {course.status === "writing" && ` · ${stats.live} live`}
        </Dimension>
        <CreationHero logos={[course.logo]} label={course.heroLabel} />
      </section>

      <div className="mx-auto max-w-[880px] border-x border-line">
        <section className="rule-bleed relative px-5 pt-12 pb-14 sm:px-10">
          {course.penNote && <PenNote className="absolute top-6 -left-36 hidden xl:flex">{course.penNote}</PenNote>}
          <p className="font-mono text-[0.7rem] tracking-[0.14em] text-muted uppercase">{course.kicker}</p>
          <h1 className="mt-4 font-serif text-[2.75rem] leading-[1.02] tracking-[-0.01em] text-ink sm:text-[4rem]">
            {before}
            <em className="text-accent-ink">{emphasis}</em>
            {after}
          </h1>
          <p className="mt-5 max-w-[560px] text-[1.075rem] leading-relaxed text-ink-2">{course.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {first ? (
              <Link
                href={`/${course.id}/${first.slug}`}
                className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-[0.92rem] text-paper transition-opacity hover:opacity-85"
              >
                Start with {first.id} <span aria-hidden>→</span>
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center gap-2 border border-accent/50 bg-accent-soft px-4 text-[0.92rem] text-accent-ink">
                <span className="size-1.5 rounded-full bg-accent" />
                Being written in public
              </span>
            )}
            <a
              href="#curriculum"
              className="inline-flex h-10 items-center border border-line px-4 text-[0.92rem] text-ink transition-colors hover:bg-paper-2"
            >
              See the curriculum
            </a>
            {bank && (
              <Link
                href={`/${course.id}/interview`}
                className="ml-1 text-[0.9rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                Interview bank
              </Link>
            )}
          </div>
        </section>

        <HatchBand />

        <SectionLabel>Before you start</SectionLabel>
        <section className="grid border-t border-line sm:grid-cols-3">
          {course.prerequisites.map(([h, body], i) => (
            <div key={h} className={`p-5 sm:p-6 ${i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""}`}>
              <h3 className="font-mono text-[0.7rem] tracking-[0.1em] text-muted uppercase">{h}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{body}</p>
            </div>
          ))}
        </section>

        <SectionLabel id="curriculum">Curriculum</SectionLabel>
        <section className="border-t border-line">
          {partsOf(course).map((part) => (
            <div key={part.id}>
              {part.title && (
                <p className="hatch border-b border-line px-5 py-2.5 font-mono text-[0.7rem] tracking-[0.14em] text-ink uppercase sm:px-6">
                  <span className="bg-paper px-1.5 py-0.5">{part.title}</span>
                </p>
              )}
              {part.modules.map((m) => (
                <div key={m.n} className="border-b border-line">
                  <div className="flex items-baseline gap-4 px-5 pt-6 pb-3 sm:px-6">
                    <span className="font-mono text-[0.75rem] text-muted">{m.n}</span>
                    <div className="flex-1">
                      <h2 className="font-serif text-[1.65rem] leading-tight text-ink">{m.title}</h2>
                      <p className="mt-0.5 text-[0.9rem] text-muted">{m.blurb}</p>
                    </div>
                    <span className="hidden font-mono text-[0.68rem] text-muted sm:block">{m.lessons.length} LESSONS</span>
                  </div>
                  <ul className="grid border-t border-line-soft sm:grid-cols-2">
                    {m.lessons.map((lesson) => {
                      const body = (
                        <>
                          <span className="w-11 shrink-0 font-mono text-[0.72rem] text-muted">{lesson.id}</span>
                          <span className={`flex-1 text-[0.93rem] ${lesson.live ? "text-ink" : "text-ink-2"}`}>
                            {lesson.title}
                            {lesson.live && <span className="ml-2 inline-block size-1.5 -translate-y-0.5 rounded-full bg-accent" />}
                          </span>
                          {(lesson.tag === "BUILD" || lesson.tag === "DESIGN" || lesson.tag === "CASE") && (
                            <span className="border border-accent/40 px-1.5 py-px font-mono text-[0.6rem] text-accent-ink">
                              {lesson.tag}
                            </span>
                          )}
                          <span className="font-mono text-[0.68rem] text-muted">{lesson.minutes}m</span>
                        </>
                      );
                      const cls =
                        "flex items-center gap-3 border-b border-line-soft px-5 py-2.5 sm:px-6 sm:odd:border-r sm:[&:nth-last-child(-n+2):nth-child(odd)]:border-b-0 last:border-b-0";
                      return lesson.live ? (
                        <li key={lesson.id} className={cls}>
                          <Link
                            href={`/${course.id}/${lesson.slug}`}
                            className="-my-2.5 flex flex-1 items-center gap-3 py-2.5 hover:[&>span:nth-child(2)]:underline"
                          >
                            {body}
                          </Link>
                        </li>
                      ) : (
                        <li key={lesson.id} className={cls}>
                          {body}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>

        {course.project && (
          <>
            <SectionLabel>The project</SectionLabel>
            <section className="border-t border-line px-5 py-8 sm:px-6">
              <p className="max-w-[600px] text-[0.97rem] leading-relaxed text-ink-2">{course.project.intro}</p>
              <ol className="mt-8">
                {course.project.steps.map((s, i, all) => (
                  <li key={s.tag} className="relative flex gap-5 pb-6 last:pb-0">
                    {i < all.length - 1 && <span className="absolute top-5 bottom-0 left-[5px] w-px bg-line" />}
                    <span className="mt-1.5 size-[11px] shrink-0 border border-accent bg-paper" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <h3 className="text-[0.98rem] font-medium text-ink">{s.title}</h3>
                        <code className="font-mono text-[0.7rem] text-muted">git checkout {s.tag}</code>
                      </div>
                      <p className="mt-0.5 text-[0.9rem] text-muted">
                        {s.detail} <span className="font-mono text-[0.68rem]">· after module {s.after}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        {bank && (
          <>
            <SectionLabel id="interview">Interview bank</SectionLabel>
            <section className="border-t border-line">
              {mostAsked.map((q) => (
                <Link
                  key={q.id}
                  href={`/${course.id}/interview#${q.id}`}
                  className="flex flex-col gap-2 border-b border-line-soft px-5 py-4 transition-colors hover:bg-paper-2 sm:px-6"
                >
                  <QuestionMeta
                    q={{ ...q, frequency: frequencyDots(q, sourceCount) }}
                    freq={`${q.seenIn.length}/${sourceCount} guides`}
                  />
                  <p className="text-[0.98rem] text-ink">{q.q.replace(/`/g, "")}</p>
                </Link>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <p className="text-[0.82rem] text-muted">
                  The most-asked questions across {sourceCount} widely read {course.title} interview guides, with model
                  answers.
                </p>
                <Link
                  href={`/${course.id}/interview`}
                  className="inline-flex h-9 items-center bg-ink px-4 text-[0.88rem] text-paper hover:opacity-85"
                >
                  Open all {bank.questions.length} questions →
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
