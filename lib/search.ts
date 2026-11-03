// Builds the site-wide search index at build time: courses, live lessons and their sections,
// interview questions and glossary terms. Served as /search.json and fetched when search opens.
import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import { lessonById, lessonsOf, publishedCourses } from "@/lib/courses";
import { getBank } from "@/lib/interview";

export type SearchKind = "course" | "lesson" | "upcoming" | "section" | "question" | "term";
export type SearchEntry = {
  kind: SearchKind;
  title: string;
  /** Where it sits, shown under the title: course, module, lesson. */
  where: string;
  href: string;
  /** Extra text that matches but isn't shown. */
  text?: string;
};

/** Markdown and MDX tags down to the words a reader sees. */
const plain = (s: string) =>
  s
    .replace(/<Term[^>]*>(.*?)<\/Term>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();

function readLesson(course: string, slug: string) {
  try {
    return fs.readFileSync(path.join(process.cwd(), "content", course, `${slug}.mdx`), "utf8");
  } catch {
    return "";
  }
}

function glossaryOf(course: string): Record<string, { term: string; def: string; lesson?: string }> {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "lib", "glossary", `${course}.json`), "utf8"));
  } catch {
    return {};
  }
}

export function buildSearchIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const course of publishedCourses) {
    out.push({ kind: "course", title: course.title, where: "Course", href: `/${course.id}`, text: course.description });

    for (const lesson of lessonsOf(course)) {
      if (!lesson.live) {
        // Listed so readers can see a topic is coming; it opens the curriculum.
        out.push({
          kind: "upcoming",
          title: lesson.title,
          where: `${course.title} · ${lesson.id} · ${lesson.module.title} · being written`,
          href: `/${course.id}#curriculum`,
        });
        continue;
      }
      const href = `/${course.id}/${lesson.slug}`;
      const source = readLesson(course.id, lesson.slug!);
      const summary = source.match(/summary:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
      out.push({
        kind: "lesson",
        title: lesson.title,
        where: `${course.title} · ${lesson.id} · ${lesson.module.title}`,
        href,
        text: summary,
      });

      // Sections, with the same anchors rehype-slug gives the rendered headings.
      const slugger = new GithubSlugger();
      let fence = false;
      for (const line of source.split("\n")) {
        if (line.trim().startsWith("```")) fence = !fence;
        const m = !fence && line.match(/^(##|###) (.+)$/);
        if (!m) continue;
        const title = plain(m[2]);
        const id = slugger.slug(title);
        if (/^(recap|interview questions)$/i.test(title)) continue;
        out.push({ kind: "section", title, where: `${lesson.id} ${lesson.title}`, href: `${href}#${id}` });
      }
    }

    const bank = getBank(course.id);
    for (const q of bank?.questions ?? []) {
      out.push({
        kind: "question",
        title: plain(q.q),
        where: `${course.title} interview · ${q.topic} · ${q.level}`,
        href: `/${course.id}/interview#${q.id}`,
      });
    }

    for (const [, entry] of Object.entries(glossaryOf(course.id))) {
      const taught = entry.lesson ? lessonById(course, entry.lesson) : undefined;
      out.push({
        kind: "term",
        title: entry.term,
        where: taught?.live ? `${course.title} glossary · taught in ${taught.id}` : `${course.title} glossary`,
        href: taught?.live ? `/${course.id}/${taught.slug}` : `/${course.id}`,
        text: entry.def,
      });
    }
  }
  return out;
}

