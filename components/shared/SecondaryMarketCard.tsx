import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * SecondaryMarketCard — placeholder for the v2 (Q3 2026) in-house secondary
 * marketplace. LPs get a dated, honest preview of how exit liquidity will
 * work before they have to commit to a primary subscription.
 */
export function SecondaryMarketCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-fg-muted">
            Liquidity & exit
          </div>
          <CardTitle className="text-base">
            In-house secondary marketplace
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className="border-amber/40 bg-amber/10 text-[10px] text-amber"
        >
          Coming Q3 2026
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-fg-muted">
          Sell vault shares to a verified counterparty before maturity.
          Whitelisted accredited LPs match via in-house orderbook. 20 bps
          platform fee per trade, no slippage from automated market makers.
          Settlement remains on-chain and atomic.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border border-line bg-bg-1 p-3">
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">
              v0 — today
            </div>
            <div className="mt-1 text-sm font-medium">Hold to maturity</div>
            <div className="mt-1 text-xs text-fg-faint">
              Primary subscription only. 1–7 yr tenor.
            </div>
          </div>
          <div className="border border-line bg-bg-1 p-3">
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">
              v1 — Q1 2026
            </div>
            <div className="mt-1 text-sm font-medium">
              Whitelisted OTC desk
            </div>
            <div className="mt-1 text-xs text-fg-faint">
              Centrifuge V3 wrapper. NAV transparency.
            </div>
          </div>
          <div className="border border-accent/40 bg-accent-soft p-3">
            <div className="text-[10px] uppercase tracking-wider text-accent-deep">
              v2 — Q3 2026
            </div>
            <div className="mt-1 text-sm font-medium text-accent-deep">
              In-house orderbook
            </div>
            <div className="mt-1 text-xs text-accent-deep/80">
              ERC-3643 KYC enforced on receive. Cross-chain via Wormhole NTT.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            disabled
            title="Secondary marketplace launches Q3 2026"
          >
            List position
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled
            title="Secondary marketplace launches Q3 2026"
          >
            Browse offers
          </Button>
          <span className="text-[11px] text-fg-faint">
            Disabled until launch · waiting on regulatory partner sign-off
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
