import type { MDXComponents } from "mdx/types";
import { Code, Terminal } from "@/components/lesson/code";
import { Aside, BeforeYouStart, Mistakes, Recap, Tripped } from "@/components/lesson/callouts";
import { Quiz } from "@/components/lesson/quiz";
import { Checkpoint } from "@/components/lesson/checkpoint";
import { LayerCacheSteps } from "@/components/lesson/layer-cache-steps";
import { InterviewCard } from "@/components/interview";
import { Anatomy, Flow, L, Stacks } from "@/components/lesson/diagrams";

// Everything a lesson can use without importing it.
const components: MDXComponents = {
  Code,
  Terminal,
  Aside,
  BeforeYouStart,
  Mistakes,
  Recap,
  Tripped,
  Quiz,
  Checkpoint,
  LayerCacheSteps,
  InterviewCard,
  Anatomy,
  Flow,
  L,
  Stacks,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
