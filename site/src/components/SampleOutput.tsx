import { codeToHtml } from "shiki";

interface SampleOutputProps {
  output: string;
  language?: string;
}

/**
 * Renders sample output as syntax-highlighted HTML.
 * SSR: this is a server component — Shiki runs at build time during SSG.
 */
export async function SampleOutput({ output, language = "markdown" }: SampleOutputProps) {
  const html = await codeToHtml(output, {
    lang: language,
    theme: "vitesse-dark",
  });

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div className="text-[10px] text-text-dim tracking-wider uppercase font-medium px-4 py-2 border-b border-border bg-surface-2">
        Example workflow output
      </div>
      <div
        className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:text-[12px] [&_pre]:leading-relaxed [&_pre]:overflow-x-auto [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
