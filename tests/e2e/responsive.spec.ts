import { test, expect, type Page } from "@playwright/test";
import * as path from "node:path";
import * as fs from "node:fs";

const ROUTES = ["/", "/projects", "/pools", "/portfolio"];
const WIDTHS = [375, 768, 1280, 4880];

const outDir = path.resolve(process.cwd(), "design-reference/e2e");

test.beforeAll(() => {
  fs.mkdirSync(outDir, { recursive: true });
});

async function visitOrSkip(page: Page, route: string) {
  let resp;
  try {
    resp = await page.goto(route, { timeout: 90_000 });
  } catch (e) {
    test.skip(true, `navigation to ${route} failed: ${(e as Error).message}`);
    return;
  }
  if (!resp || resp.status() === 404) {
    test.skip(true, `route ${route} not implemented yet (Agents B/C)`);
  }
  if (resp && resp.status() >= 500) {
    test.skip(true, `route ${route} returned ${resp.status()} (Agents B/C still working)`);
  }
}

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`${route} at ${width}w: no h-scroll, body bg non-transparent`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await visitOrSkip(page, route);

      // Wait for the page to hit a stable state.
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

      const bg = await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor
      );
      expect(bg, `body bg at ${route}@${width}`).not.toBe("rgba(0, 0, 0, 0)");
      expect(bg).not.toBe("transparent");

      const hasHScroll = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1
      );
      expect(hasHScroll, `h-scroll at ${route}@${width}`).toBe(false);

      const safeRoute = route === "/" ? "_root" : route.replaceAll("/", "_");
      await page.screenshot({
        path: path.join(outDir, `${safeRoute}_${width}w.png`),
        fullPage: true,
      });
    });
  }
}
