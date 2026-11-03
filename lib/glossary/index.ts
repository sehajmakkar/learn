// Plain-language definitions shown by <Term>. Each course has its own file, because the same word
// can be taught by different lessons (or mean something slightly different) in each course.
import docker from "@/lib/glossary/docker.json";
import systemDesign from "@/lib/glossary/system-design.json";

export type GlossaryEntry = { term: string; def: string; lesson?: string };

const glossaries: Record<string, Record<string, GlossaryEntry>> = {
  docker,
  "system-design": systemDesign,
};

export function glossaryEntry(courseId: string, id: string): GlossaryEntry | undefined {
  return glossaries[courseId]?.[id];
}
