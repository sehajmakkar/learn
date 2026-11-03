import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InterviewBank } from "@/components/interview-bank";
import { courses, getCourse } from "@/lib/courses";
import { getBank } from "@/lib/interview";

export const instant = false;

export function generateStaticParams() {
  return courses.filter((c) => getBank(c.id)).map((c) => ({ course: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[course]/interview">): Promise<Metadata> {
  const course = getCourse((await params).course);
  const bank = course && getBank(course.id);
  if (!course || !bank) return {};
  const n = Object.keys(bank.sources).length;
  return {
    title: `${course.title} interview questions`,
    description: `${bank.questions.length} ${course.title} interview questions with model answers, ranked by how many of ${n} widely read interview guides ask them.`,
  };
}

/** Smallest number of guides that earns each dot count (see frequencyDots). */
function thresholds(n: number) {
  const at = (share: number) => Math.ceil(share * n - 1e-9);
  return { four: at(0.7), three: at(0.45), two: at(0.27) };
}

export default async function InterviewPage({ params }: PageProps<"/[course]/interview">) {
  const course = getCourse((await params).course);
  const bank = course && getBank(course.id);
  if (!course || !bank) notFound();

  const n = Object.keys(bank.sources).length;
  const t = thresholds(n);
  const most = bank.questions.filter((q) => q.seenIn.length >= t.four).length;

  return (
    <div className="mx-auto max-w-[880px] border-x border-line">
      <section className="px-5 pt-10 pb-8 sm:px-10">
        <div className="flex items-center gap-2 text-[0.82rem] text-muted">
          <Link href={`/${course.id}`} className="hover:text-ink">
            {course.title}
          </Link>
          <span>/</span>
          <span>Interview bank</span>
        </div>
        <p className="mt-8 font-mono text-[0.72rem] tracking-[0.12em] text-muted uppercase">
          Interview bank · {bank.questions.length} questions
        </p>
        <h1 className="mt-3 font-serif text-[2.5rem] leading-[1.05] text-ink sm:text-[3.4rem]">
          {course.title} interview questions, <em className="text-accent-ink">ranked by how often they&apos;re asked</em>.
        </h1>
        <p className="mt-5 max-w-[620px] text-[1.05rem] leading-relaxed text-ink-2">
          We read {n} of the most widely used {course.title} interview guides and counted which questions each one
          includes. {most} questions appear in at least {t.four} of them. Every question has a model answer written for
          this course, likely follow-ups, and a link to the lesson that teaches it.
        </p>

        <details className="mt-6 border border-line bg-paper-2 px-5 py-4 text-[0.92rem] text-ink-2">
          <summary className="cursor-pointer font-mono text-[0.72rem] tracking-[0.1em] text-muted uppercase hover:text-ink">
            How this list was made
          </summary>
          <div className="mt-3 space-y-3 leading-relaxed">
            <p>
              In {bank.checked} we collected every question from the guides below and grouped questions that ask the
              same thing in different words. A question&apos;s frequency is the number of guides that include it: ●●●●
              means {t.four} or more of {n}, ●●● {t.three} to {t.four - 1}, ●● {t.two} to {t.three - 1}, ● fewer.
              Guides aren&apos;t interviews, so treat it as a strong signal of what interviewers draw on, not a record of
              real interviews.
            </p>
            <p>
              Questions marked <span className="text-ink">our pick</span> appear in few guides but come up in real work
              and in senior interviews, so we added them. The answers are our own; none are copied from the guides.
            </p>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {Object.values(bank.sources).map((s) => (
                <li key={s.url}>
                  <a href={s.url} className="underline decoration-line underline-offset-4 hover:text-ink" rel="noopener">
                    {s.name}
                  </a>{" "}
                  <span className="font-mono text-[0.7rem] text-muted">{s.count} questions</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </section>

      <section className="border-t border-line px-5 pb-16 sm:px-10">
        <InterviewBank course={course.id} />
      </section>
    </div>
  );
}
