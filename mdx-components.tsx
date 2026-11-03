import type { MDXComponents } from "mdx/types";
import { Code, Terminal } from "@/components/lesson/code";
import { Analogy, Aside, BeforeYouStart, Mistakes, Recap } from "@/components/lesson/callouts";
import { Term } from "@/components/lesson/term";
import { Quiz } from "@/components/lesson/quiz";
import { Checkpoint } from "@/components/lesson/checkpoint";
import { LayerCacheSteps } from "@/components/lesson/layer-cache-steps";
import { InterviewCard } from "@/components/interview";
import { Anatomy, Flow, L, Stacks } from "@/components/lesson/diagrams";
import { Arch, Evolve } from "@/components/lesson/arch";
import { Sequence } from "@/components/lesson/sequence";

// Everything a lesson can use without importing it.
const components: MDXComponents = {
  Code,
  Terminal,
  Analogy,
  Term,
  Aside,
  BeforeYouStart,
  Mistakes,
  Recap,
  Quiz,
  Checkpoint,
  LayerCacheSteps,
  InterviewCard,
  Anatomy,
  Flow,
  L,
  Stacks,
  Arch,
  Evolve,
  Sequence,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
