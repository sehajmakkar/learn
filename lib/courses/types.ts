// Shared shape of every course on the site.

export type Lesson = {
  id: string; // "02.03"
  title: string;
  minutes: number;
  tag?: "CODE" | "BUILD" | "CONCEPT" | "DESIGN" | "CASE";
  slug?: string;
  live?: boolean;
};

export type Module = { n: string; title: string; blurb: string; part?: string; lessons: Lesson[] };

export type Part = { id: string; title: string };

export type ProjectStep = { tag: string; title: string; after: string; detail: string };

export type CourseLogo = { title: string; hex: string; path: string };

export type Course = {
  /** URL segment and content folder: /docker, content/docker. */
  id: string;
  title: string;
  status: "live" | "writing" | "planned";
  logo: CourseLogo;
  /** Short label printed between the hero's fingers. */
  heroLabel: string;
  kicker: string;
  /** Headline as [before, emphasised, after]. */
  headline: [string, string, string];
  description: string;
  penNote?: string;
  prerequisites: [string, string][];
  parts?: Part[];
  modules: Module[];
  project?: { intro: string; steps: ProjectStep[] };
  meta: { title: string; description: string };
};

/** Lesson builder used by course outlines: a lesson is live once it has a slug. */
export const l = (id: string, title: string, minutes: number, tag?: Lesson["tag"], slug?: string): Lesson => ({
  id,
  title,
  minutes,
  tag,
  slug,
  live: Boolean(slug),
});

export type InterviewQ = {
  q: string;
  level: "Junior" | "Mid" | "Senior";
  frequency: 1 | 2 | 3 | 4;
  importance: "Must-know" | "Good to know";
  kind: "Concept" | "Scenario" | "Debugging" | "Design";
  lesson?: string;
};
