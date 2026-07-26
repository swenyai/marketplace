/**
 * The hosted dashboard at cloud.sweny.ai is an experiment that is not running.
 * Linking it from the marketplace implies a live product and costs credibility
 * when a visitor clicks through to nothing.
 *
 * The per-component test in install-button.test.tsx only covers the component
 * it renders. This guard scans every source file that can reach the DOM, so a
 * link added to a page, layout, or component that has no test of its own is
 * still caught.
 *
 * If the service launches, delete this file rather than weakening it.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Every .ts/.tsx under src/, minus tests and type declarations. */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, acc);
    } else if (/\.tsx?$/.test(entry) && !/\.d\.ts$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

const files = sourceFiles(srcDir);

describe("no cloud.sweny.ai promotion in rendered source", () => {
  it("finds source files to scan (guards against a silently empty sweep)", () => {
    // Without this, a broken walker would make every assertion below vacuous.
    expect(files.length).toBeGreaterThan(5);
  });

  it("no source file links to the cloud host", () => {
    const offenders = files
      .filter((f) => /https?:\/\/cloud\.sweny\.ai/.test(readFileSync(f, "utf8")))
      .map((f) => relative(srcDir, f));

    expect(offenders).toEqual([]);
  });

  it("no source file renders the bare cloud hostname as copy", () => {
    const offenders = files
      .filter((f) => /cloud\.sweny\.ai/.test(readFileSync(f, "utf8")))
      .map((f) => relative(srcDir, f));

    expect(offenders).toEqual([]);
  });

  it("the footer links docs instead", () => {
    // Pins the replacement, so the nav slot cannot quietly go missing either.
    const layout = readFileSync(join(srcDir, "app", "layout.tsx"), "utf8");
    expect(layout).toMatch(/https:\/\/docs\.sweny\.ai/);
  });
});
