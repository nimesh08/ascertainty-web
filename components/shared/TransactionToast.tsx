"use client";

import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { explorerTx, shortSig } from "@/lib/utils/format";

export interface ShowTxToastArgs {
  signature: string;
  title?: string;
  description?: string;
  cluster?: string;
}

/**
 * Show a sonner toast with a "View on Explorer" link for a confirmed signature.
 * Designed to be called imperatively from anywhere in the app (client only).
 */
export function showTxToast({
  signature,
  title = "Transaction confirmed",
  description,
  cluster = "devnet",
}: ShowTxToastArgs) {
  toast.success(title, {
    description: (
      <div className="flex flex-col gap-1">
        {description ? (
          <span className="text-xs text-fg-muted">{description}</span>
        ) : null}
        <a
          href={explorerTx(signature, cluster)}
          target="_blank"
          rel="noopener"
          className="mono-num inline-flex items-center gap-1 text-xs underline"
        >
          {shortSig(signature, 8)}
          <ExternalLink className="size-3" />
          <span className="not-mono-num">View on Explorer →</span>
        </a>
      </div>
    ),
  });
}

export function showTxErrorToast(title: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  toast.error(title, { description: msg });
}
