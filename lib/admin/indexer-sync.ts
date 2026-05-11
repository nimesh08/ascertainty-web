"use client";

/**
 * Triggers a best-effort indexer re-sync from the client after an admin
 * mutation has confirmed on-chain. The dev token is read from
 * `NEXT_PUBLIC_DEV_INDEXER_TOKEN` — if unset, the call is skipped (prod
 * deployments will drive the indexer on a schedule instead).
 *
 * Failures are swallowed: the authoritative DB write already happened in
 * the corresponding `/api/admin/*` handler; the indexer is only a
 * reconciliation layer.
 */
export async function triggerIndexerSync(): Promise<void> {
  const token = process.env.NEXT_PUBLIC_DEV_INDEXER_TOKEN;
  if (!token) return;
  try {
    await fetch("/api/indexer/sync", {
      method: "POST",
      headers: { "x-dev-indexer-token": token },
    });
  } catch {
    // swallow — DB rows are already written by the admin POST handler
  }
}
