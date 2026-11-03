// Shape of a course's interview bank.

export type Source = { name: string; url: string; count: number };

export type BankQuestion = {
  id: string;
  q: string;
  topic: string;
  level: "Junior" | "Mid" | "Senior";
  importance: "Must-know" | "Good to know";
  kind: "Concept" | "Scenario" | "Debugging" | "Design";
  /** Ids of the guides that include this question; their count is its frequency. */
  seenIn: string[];
  /** Few guides list it, but we think it matters. */
  pick?: boolean;
  /** Paragraphs; `backticks` render as code. */
  answer: string[];
  followUps?: string[];
  lesson?: string;
};

export type Bank = {
  /** When the guides were read, e.g. "November 2026". */
  checked: string;
  sources: Record<string, Source>;
  topics: readonly string[];
  questions: BankQuestion[];
};

export const levelOrder = { Junior: 0, Mid: 1, Senior: 2 } as const;

/** 1–4 dots from the share of guides that include the question. */
export function frequencyDots(q: BankQuestion, sourceCount: number): 1 | 2 | 3 | 4 {
  const share = q.seenIn.length / sourceCount;
  return share >= 0.7 ? 4 : share >= 0.45 ? 3 : share >= 0.27 ? 2 : 1;
}
