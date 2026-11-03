import type { Metadata } from "next";
import Content from "@/content/styleguide.mdx";

export const metadata: Metadata = {
  title: "Lesson components",
  description: "Every component a lesson can use, with an example of each.",
  robots: { index: false },
};

// Not linked from the site: a working reference for writing lessons.
export default function Styleguide() {
  return (
    <div className="mx-auto max-w-[880px] border-x border-line px-5 pt-10 pb-20 sm:px-10">
      <p className="font-mono text-[0.7rem] tracking-[0.14em] text-muted uppercase">For authors</p>
      <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.05] text-ink">Lesson components</h1>
      <article className="prose-lesson mt-8">
        <Content />
      </article>
    </div>
  );
}
