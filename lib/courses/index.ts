// Every course on the site, and helpers to look things up in them.
import { docker } from "@/lib/courses/docker";
import { systemDesign } from "@/lib/courses/system-design";
import type { Course } from "@/lib/courses/types";

export const courses: Course[] = [docker, systemDesign];

/** Courses with a public landing page. Planned ones only appear in the library. */
export const publishedCourses = courses.filter((c) => c.status !== "planned");

export function getCourse(id: string) {
  return courses.find((c) => c.id === id);
}

export function lessonsOf(course: Course) {
  return course.modules.flatMap((m) => m.lessons.map((lesson) => ({ ...lesson, module: m })));
}

export type CourseLesson = ReturnType<typeof lessonsOf>[number];

export function lessonById(course: Course, id: string) {
  return lessonsOf(course).find((x) => x.id === id);
}

export function statsOf(course: Course) {
  const lessons = lessonsOf(course);
  return {
    modules: course.modules.length,
    lessons: lessons.length,
    live: lessons.filter((x) => x.live).length,
    hours: Math.round(lessons.reduce((sum, x) => sum + x.minutes, 0) / 60),
  };
}

/** The module groups to show, by part when the course has parts. */
export function partsOf(course: Course) {
  if (!course.parts) return [{ id: "all", title: "", modules: course.modules }];
  return course.parts.map((p) => ({ ...p, modules: course.modules.filter((m) => m.part === p.id) }));
}
