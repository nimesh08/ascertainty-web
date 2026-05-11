/**
 * Indexer module public surface.
 *
 * Consumers should import from `@/lib/indexer` rather than reaching into
 * individual sync files so we can rearrange internals without touching
 * callers.
 */

export { getConnection, getReadOnlyProgram, getRpcUrl, PROGRAM_ID } from "./connection";
export { DISCRIMINATORS, ACCOUNT_NAMES } from "./discriminators";
export type { AccountName } from "./discriminators";
export * from "./decode";
export { getIndexerSql, closeIndexerSql } from "./db";
export type { SyncResult } from "./db";
export { syncAll } from "./sync-all";
export type { SyncAllResult } from "./sync-all";
export { syncMrvProjects } from "./sync-mrv-projects";
export { syncProjects } from "./sync-projects";
export { syncPools } from "./sync-pools";
export { syncPoolProjectLinks } from "./sync-pool-project-links";
export { syncInvestorPositions } from "./sync-investor-positions";
export { syncAuditors } from "./sync-auditors";
export { syncBaselines } from "./sync-baselines";
export { syncVerifications } from "./sync-verifications";
