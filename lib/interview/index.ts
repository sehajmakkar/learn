import { dockerBank } from "@/lib/interview/docker";
import type { Bank } from "@/lib/interview/types";

const banks: Record<string, Bank> = { docker: dockerBank };

export function getBank(courseId: string): Bank | undefined {
  return banks[courseId];
}
