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
import { Levels, Seen, SeenInProduction } from "@/components/lesson/design";
import { DesignIt } from "@/components/lesson/design-it";
import { NumbersToKnow } from "@/components/lesson/numbers";
import { Lab } from "@/components/lesson/lab";
import { EstimateLab } from "@/components/labs/estimate";
import { LoadBalancerLab } from "@/components/labs/load-balancer";
import { TailLatencyLab } from "@/components/labs/tail-latency";
import { BTreeLab } from "@/components/labs/btree";

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
  SeenInProduction,
  Seen,
  DesignIt,
  Levels,
  NumbersToKnow,
  Lab,
  EstimateLab,
  LoadBalancerLab,
  TailLatencyLab,
  BTreeLab,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
