/**
 * Orchestrator: run every `sync-*` module in FK-safe dependency order.
 *
 *   1. mrv_projects   (no deps)
 *   2. projects        (needs mrv_projects for FK + denorm name fields)
 *   3. pools           (no deps)
 *   4. pool_project_links (needs pools + projects for uuid lookups)
 *   5. investor_positions (needs projects + pools)
 *   6. auditors        (no deps)
 *   7. baselines       (needs mrv_projects + auditors)
 *   8. verifications   (needs mrv_projects + auditors)
 */

import { syncAuditors } from "./sync-auditors";
import { syncBaselines } from "./sync-baselines";
import { syncInvestorPositions } from "./sync-investor-positions";
import { syncMrvProjects } from "./sync-mrv-projects";
import { syncPoolProjectLinks } from "./sync-pool-project-links";
import { syncPools } from "./sync-pools";
import { syncProjects } from "./sync-projects";
import { syncVerifications } from "./sync-verifications";
import type { SyncResult } from "./db";

export interface SyncAllResult {
  ok: boolean;
  durationMs: number;
  counts: Record<string, SyncResult>;
  error?: string;
}

export async function syncAll(): Promise<SyncAllResult> {
  const started = Date.now();
  const counts: Record<string, SyncResult> = {};

  const steps: Array<[string, () => Promise<SyncResult>]> = [
    ["mrv_projects", syncMrvProjects],
    ["projects", syncProjects],
    ["pools", syncPools],
    ["pool_project_links", syncPoolProjectLinks],
    ["investor_positions", syncInvestorPositions],
    ["auditors", syncAuditors],
    ["baselines", syncBaselines],
    ["verifications", syncVerifications],
  ];

  try {
    for (const [name, fn] of steps) {
      const stepStart = Date.now();
      const res = await fn();
      counts[name] = res;
      console.log(
        `[sync-all] ${name}: found=${res.count} upserted=${res.upserted} ` +
          `skipped=${res.skipped} errors=${res.errors.length} ` +
          `(${Date.now() - stepStart}ms)`
      );
    }

    return {
      ok: true,
      durationMs: Date.now() - started,
      counts,
    };
  } catch (e) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      counts,
      error: (e as Error).message,
    };
  }
}
