# sehaj/learn

Free, open-source courses that take one technology from first principles to production. Each course is written to
be read next to a terminal, with predict-first quizzes, hands-on checkpoints, a project built step by step, and an
interview bank.

Docker is the first course.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How it's organised

| Path | What's there |
| --- | --- |
| `content/<topic>/<slug>.mdx` | One lesson. Exports `meta` (summary, related lessons) next to its content. |
| `lib/docker.ts` | Course outline: modules, lessons, project steps, sample interview questions. A lesson goes live when it has a slug. |
| `components/lesson/` | Lesson building blocks: code and terminal blocks, quiz, checkpoint, callouts, diagrams. |
| `components/creation-hero.tsx` | The brand mark: the hands drawn as dots, with the topic logo between the fingers. |
| `scripts/build-hands.mjs` | Turns `assets/hands-source.png` into `public/hands.bin`, the dot map the hero draws. |

Lesson components are available in every MDX file without importing them (see `mdx-components.tsx`).

## Adding a lesson

1. Write `content/docker/<slug>.mdx`, starting with `export const meta = { summary, uses, usedIn }`.
2. Add the slug to its entry in `lib/docker.ts`.
3. Run every command in it yourself before publishing.
