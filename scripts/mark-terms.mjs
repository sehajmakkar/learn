// Wraps the first plain-prose use of glossary terms in each lesson with <Term t="...">.
// Rerunnable: terms already marked in a lesson are left alone.
// Run: node scripts/mark-terms.mjs <course> [--dry]   (course defaults to docker)
import fs from "node:fs";
import path from "node:path";

const MAX_PER_LESSON = 6;
const dry = process.argv.includes("--dry");
const course = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "docker";
const glossary = JSON.parse(fs.readFileSync(`lib/glossary/${course}.json`, "utf8"));

// Lesson order and ids come from the outline in lib/courses/<course>.ts.
const outline = fs.readFileSync(`lib/courses/${course}.ts`, "utf8");
const lessons = [...outline.matchAll(/l\("(\d\d\.\d\d)", "[^"]*", \d+, (?:"\w+"|undefined), "([a-z0-9-]+)"\)/g)].map((m) => ({
  id: m[1],
  slug: m[2],
}));
const order = new Map(lessons.map((l, i) => [l.id, i]));

const patterns = Object.entries(glossary).map(([id, e]) => ({
  id,
  lesson: e.lesson,
  everyday: Boolean(e.everyday),
  re: new RegExp(e.match.join("|"), e.caseSensitive ? "" : "i"),
}));
const moduleOf = (lessonId) => Number(lessonId.slice(0, 2));

// Parts of a line that must never be wrapped: inline code, JSX tags, existing terms, links, bold markers, URLs.
const EXCLUDED = /`[^`]*`|<Term\b[^>]*>.*?<\/Term>|<[^>]+>|\[[^\]]*\]\([^)]*\)|\*\*|https?:\/\/\S+/g;

function firstMatch(line, re) {
  let pos = 0;
  const segments = [];
  for (const m of line.matchAll(EXCLUDED)) {
    segments.push([pos, m.index]);
    pos = m.index + m[0].length;
  }
  segments.push([pos, line.length]);
  for (const [a, b] of segments) {
    const m = line.slice(a, b).match(re);
    if (m) return { start: a + m.index, end: a + m.index + m[0].length };
  }
  return null;
}

/** Indexes of lines that are plain prose: not code, not JSX props, not headings, not the meta export. */
function proseLines(lines) {
  const ok = [];
  let fence = false;
  let template = false;
  let props = false;
  let meta = false;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (meta) {
      if (line === "};") meta = false;
      return;
    }
    if (line.startsWith("export ")) {
      meta = !line.endsWith(";");
      return;
    }
    if (line.startsWith("```")) {
      fence = !fence;
      return;
    }
    if (fence) return;
    if (template) {
      if (line.includes("`}")) template = false;
      return;
    }
    if (line.includes("{`") && !line.includes("`}")) {
      template = true;
      return;
    }
    if (props) {
      if (line === ">" || line.endsWith("/>")) props = false;
      return;
    }
    if (/^<[A-Z]\w*/.test(line) && !line.endsWith(">")) {
      props = true;
      return;
    }
    if (!line || line.startsWith("<") || line.startsWith("#") || /^\|[\s|:-]+\|$/.test(line)) return;
    ok.push(i);
  });
  return ok;
}

const report = [];
for (const { id: lessonId, slug } of lessons) {
  const file = path.join(`content/${course}`, `${slug}.mdx`);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const prose = proseLines(lines);
  const here = order.get(lessonId);

  const candidates = [];
  for (const p of patterns) {
    if (p.lesson === lessonId) continue; // the lesson that teaches it explains it in full
    if (lines.some((l) => l.includes(`<Term t="${p.id}"`))) continue;
    for (const i of prose) {
      const m = firstMatch(lines[i], p.re);
      if (!m) continue;
      // Forward references first, then terms the course never teaches, then recently taught ones,
      // then everyday words. Terms taught more than a module ago are assumed known.
      if (p.lesson && order.get(p.lesson) < here && moduleOf(lessonId) - moduleOf(p.lesson) > 1) break;
      const rank = p.everyday ? 3 : p.lesson === undefined ? 1 : order.get(p.lesson) > here ? 0 : 2;
      candidates.push({ ...p, line: i, rank });
      break;
    }
  }
  candidates.sort((a, b) => a.rank - b.rank || a.line - b.line);
  const chosen = candidates.slice(0, MAX_PER_LESSON - lines.join("\n").split("<Term ").length + 1);

  // Wrap right to left within a line so earlier offsets stay valid.
  for (const c of chosen.sort((a, b) => b.line - a.line)) {
    const m = firstMatch(lines[c.line], c.re);
    if (!m) continue;
    const text = lines[c.line].slice(m.start, m.end);
    lines[c.line] = `${lines[c.line].slice(0, m.start)}<Term t="${c.id}">${text}</Term>${lines[c.line].slice(m.end)}`;
  }
  report.push(`${lessonId} ${slug}: ${chosen.map((c) => c.id).join(", ") || "-"}`);
  if (!dry) fs.writeFileSync(file, lines.join("\n"));
}
console.log(report.join("\n"));
