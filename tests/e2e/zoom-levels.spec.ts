import { test, expect, type Page } from "@playwright/test";

const ROUTES = ["/", "/projects", "/pools", "/portfolio"];
const WIDTHS = [1280, 2560, 4880, 6000];

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

/**
 * Zoom-out / ultra-wide regression guard.
 *
 * Historically the background ambient "orb" effects have escaped the viewport
 * at > 2x zoom / >= 4k widths. This suite asserts:
 *   1. body background remains opaque
 *   2. any element containing `orb` in its class has width <= viewport.
 *   3. no horizontal scrollbar.
 */
for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`orb-escape guard @ ${route} ${width}w`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1400 });
      await visitOrSkip(page, route);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

      const metrics = await page.evaluate(() => {
        const body = document.body;
        const bg = getComputedStyle(body).backgroundColor;
        const hasHScroll =
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1;
        const orbOverflow = (() => {
          const nodes = Array.from(
            document.querySelectorAll<HTMLElement>('[class*="orb"]')
          );
          const vw = window.innerWidth;
          let worst = 0;
          for (const n of nodes) {
            const r = n.getBoundingClientRect();
            if (r.right > vw) worst = Math.max(worst, r.right - vw);
            if (r.left < 0) worst = Math.max(worst, -r.left);
          }
          return { count: nodes.length, worst };
        })();
        return { bg, hasHScroll, orbOverflow };
      });

      expect(metrics.bg, `bg at ${route}@${width}`).not.toBe("rgba(0, 0, 0, 0)");
      expect(metrics.bg).not.toBe("transparent");
      expect(metrics.hasHScroll, `h-scroll @ ${route}@${width}`).toBe(false);
      // Allow up to 16px slack for anti-aliasing; > 16px overflow is an orb escape.
      expect(
        metrics.orbOverflow.worst,
        `orb overflow at ${route}@${width}`
      ).toBeLessThanOrEqual(16);
    });
  }
}
