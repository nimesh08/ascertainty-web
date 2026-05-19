import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Convention-based hero image resolver for project cards.
 *
 * Drop a .webp (or .jpg/.png) at:
 *     public/images/projects/<slug>.<ext>
 * where <slug> is the project's msme_name slugified
 * (lowercased, alphanumerics + hyphens, no leading/trailing hyphens).
 *
 * The resolver checks disk at request time and returns the public URL
 * if the file exists; otherwise undefined → ProjectHero falls back to
 * the SVG placeholder. No DB column, no manifest, no broken-image flash.
 */

const EXT_PRIORITY = ["webp", "jpg", "jpeg", "png", "avif"];

export function projectSlug(msmeName: string): string {
  return msmeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveHeroImage(msmeName: string): string | undefined {
  const slug = projectSlug(msmeName);
  for (const ext of EXT_PRIORITY) {
    const publicPath = `/images/projects/${slug}.${ext}`;
    const diskPath = join(process.cwd(), "public", publicPath);
    if (existsSync(diskPath)) return publicPath;
  }
  return undefined;
}
