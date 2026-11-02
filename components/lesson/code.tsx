import { codeToHtml } from "shiki";
import { CopyButton } from "@/components/lesson/copy-button";

async function highlight(code: string, lang: string) {
  "use cache";
  return codeToHtml(code, {
    lang,
    themes: { light: "vitesse-light", dark: "vitesse-dark" },
    defaultColor: "light",
  });
}

/** A source file: filename tab, highlighted code, copy button. */
export async function Code({ children, lang = "bash", file }: { children: string; lang?: string; file?: string }) {
  const code = children.replace(/^\n+|\s+$/g, "");
  const html = await highlight(code, lang);
  return (
    <figure className="not-prose group my-6 border border-line bg-code">
      <figcaption className="flex h-9 items-center justify-between border-b border-line pl-4 pr-1.5">
        <span className="font-mono text-[0.72rem] text-muted">{file ?? lang}</span>
        <CopyButton text={code} />
      </figcaption>
      <div
        className="overflow-x-auto px-4 py-3.5 font-mono text-[0.85rem] leading-[1.65] [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  );
}

/**
 * A terminal session. Lines starting with "$ " are commands; everything else is output.
 * Only the commands are copied.
 */
export function Terminal({ children, title = "terminal" }: { children: string; title?: string }) {
  const lines = children.replace(/^\n+|\s+$/g, "").split("\n");
  const commands = lines.filter((l) => l.startsWith("$ ")).map((l) => l.slice(2));
  return (
    <figure className="not-prose my-6 border border-line bg-code">
      <figcaption className="flex h-9 items-center justify-between border-b border-line pr-1.5 pl-4">
        <span className="flex items-center gap-2 font-mono text-[0.72rem] text-muted">
          <span className="text-accent">❯</span>
          {title}
        </span>
        <CopyButton text={commands.join("\n")} />
      </figcaption>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[0.83rem] leading-[1.65]">
        {lines.map((line, i) =>
          line.startsWith("$ ") ? (
            <div key={i} className="text-ink">
              <span className="text-accent select-none">$ </span>
              {line.slice(2)}
            </div>
          ) : (
            <div key={i} className="text-muted">
              {line || " "}
            </div>
          ),
        )}
      </pre>
    </figure>
  );
}
