import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageHeader, PageShell, StatStrip } from "./kit";

const css = readFileSync("src/app/globals.css", "utf8");

// The app is meant to show a lot on one screen while staying readable.
describe("density contract", () => {
  it("sets a base size between 13 and 15px so every rem-based size scales down", () => {
    const px = Number(/html\s*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/.exec(css)?.[1]);
    expect(px).toBeGreaterThanOrEqual(13);
    expect(px).toBeLessThanOrEqual(15);
  });

  it("keeps primary controls compact: 36px tall, not 44px", () => {
    expect(/\.btn-primary\s*\{[^}]*min-h-\[36px\]/.test(css)).toBe(true);
    expect(/\.input-field\s*\{[^}]*min-h-\[36px\]/.test(css)).toBe(true);
  });

  it("gives pages a wide, tight shell", () => {
    const html = renderToStaticMarkup(<PageShell>x</PageShell>);
    expect(html).toContain("max-w-7xl");
    expect(html).not.toContain("py-14");
  });

  it("caps page titles below 3xl", () => {
    const html = renderToStaticMarkup(<PageHeader title="T" />);
    expect(html).not.toMatch(/text-[45]xl/);
  });

  it("keeps stat figures modest", () => {
    const html = renderToStaticMarkup(<StatStrip items={[{ label: "a", value: 1 }]} />);
    expect(html).not.toContain("sm:text-4xl");
  });
});
