import Link from "next/link";
import type { Metadata } from "next";
import { siDocker } from "simple-icons";
import { CreationHero } from "@/components/creation-hero";
import { Dimension, HatchBand, PenNote, SectionLabel } from "@/components/blueprint";
import { QuestionMeta } from "@/components/interview";
import { interviewSample, modules, projectSteps, stats } from "@/lib/docker";

export const metadata: Metadata = {
  title: "Docker, from first principles",
  description: "Learn Docker from what a container is to shipping one to production, with quizzes, a project and an interview bank.",
};

const docker = { title: siDocker.title, hex: siDocker.hex, path: siDocker.path };

export default function DockerPage() {
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
        <Dimension className="mx-auto mb-4 max-w-[880px]">
          {stats.modules} modules · {stats.lessons} lessons · ~{stats.hours} hrs
        </Dimension>
        <CreationHero logos={[docker]} label="docker" />
      </section>

      <div className="mx-auto max-w-[880px] border-x border-line">
        <section className="rule-bleed relative px-5 pt-12 pb-14 sm:px-10">
          <PenNote className="absolute top-6 -left-36 hidden xl:flex">free, no login</PenNote>
          <p className="font-mono text-[0.7rem] tracking-[0.14em] text-muted uppercase">Course 01 · Docker · v0.1</p>
          <h1 className="mt-4 font-serif text-[2.75rem] leading-[1.02] tracking-[-0.01em] text-ink sm:text-[4rem]">
            Docker, from <em className="text-accent-ink">first principles</em>.
          </h1>
          <p className="mt-5 max-w-[560px] text-[1.075rem] leading-relaxed text-ink-2">
            Start with what a container really is. Finish by shipping a four-service app to a real server. Every lesson
            has commands to run, a quiz to check yourself, and the interview questions it prepares you for.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/docker/layers-and-build-cache"
              className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-[0.92rem] text-paper transition-opacity hover:opacity-85"
            >
              Read the sample lesson <span aria-hidden>→</span>
            </Link>
            <a
              href="#curriculum"
              className="inline-flex h-10 items-center border border-line px-4 text-[0.92rem] text-ink transition-colors hover:bg-paper-2"
            >
              See the curriculum
            </a>
            <a href="#interview" className="ml-1 text-[0.9rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">
              Interview bank
            </a>
          </div>
        </section>

        <HatchBand />

        <SectionLabel>Before you start</SectionLabel>
        <section className="grid border-t border-line sm:grid-cols-3">
          {[
            ["You should know", "Basic terminal use: cd, ls, running a command. Some idea of what a web server is."],
            ["You'll need", "A laptop that can run Docker Desktop or Docker Engine, and about 10 GB of free disk."],
            ["You'll leave with", "A production-ready image, a Compose stack, a CI pipeline and a deployed app on your GitHub."],
          ].map(([h, body], i) => (
            <div key={h} className={`p-5 sm:p-6 ${i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""}`}>
              <h3 className="font-mono text-[0.7rem] tracking-[0.1em] text-muted uppercase">{h}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{body}</p>
            </div>
          ))}
        </section>

        <SectionLabel id="curriculum">Curriculum</SectionLabel>
        <section className="border-t border-line">
          {modules.map((m) => (
            <div key={m.n} className="border-b border-line last:border-b-0">
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
                      {lesson.tag === "BUILD" && (
                        <span className="border border-accent/40 px-1.5 py-px font-mono text-[0.6rem] text-accent-ink">BUILD</span>
                      )}
                      <span className="font-mono text-[0.68rem] text-muted">{lesson.minutes}m</span>
                    </>
                  );
                  const cls =
                    "flex items-center gap-3 border-b border-line-soft px-5 py-2.5 sm:px-6 sm:odd:border-r sm:[&:nth-last-child(-n+2):nth-child(odd)]:border-b-0 last:border-b-0";
                  return lesson.live ? (
                    <li key={lesson.id} className={cls}>
                      <Link href={`/docker/${lesson.slug}`} className="-my-2.5 flex flex-1 items-center gap-3 py-2.5 hover:[&>span:nth-child(2)]:underline">
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
        </section>

        <SectionLabel>The project</SectionLabel>
        <section className="border-t border-line px-5 py-8 sm:px-6">
          <p className="max-w-[600px] text-[0.97rem] leading-relaxed text-ink-2">
            One app, built a step at a time as you learn. A Node API with Postgres, Redis and Nginx. Every step is a git
            tag in the companion repo, so you can check out any point and compare.
          </p>
          <ol className="mt-8">
            {projectSteps.map((s, i) => (
              <li key={s.tag} className="relative flex gap-5 pb-6 last:pb-0">
                {i < projectSteps.length - 1 && <span className="absolute top-5 bottom-0 left-[5px] w-px bg-line" />}
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

        <SectionLabel id="interview">Interview bank</SectionLabel>
        <section className="border-t border-line">
          {interviewSample.map((q) => (
            <div key={q.q} className="flex flex-col gap-2 border-b border-line-soft px-5 py-4 sm:px-6">
              <QuestionMeta q={q} />
              <p className="text-[0.98rem] text-ink">{q.q}</p>
            </div>
          ))}
          <p className="px-5 py-4 text-[0.82rem] text-muted sm:px-6">
            Frequency is our own estimate from public interview write-ups. A question only says “asked at” a company when
            we can link to the source.
          </p>
        </section>
      </div>
    </>
  );
}
