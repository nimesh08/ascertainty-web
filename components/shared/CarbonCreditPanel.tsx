import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPITile } from "./KPITile";
import {
  CARBON_PRICE_USD_PER_TCO2,
  estimateCarbon,
} from "@/lib/demo/carbon";

interface CarbonCreditPanelProps {
  equipmentType: string;
  predictedKwhPerYear: number;
  audienceLabel?: string; // optional override for who the panel speaks to
}

/**
 * CarbonCreditPanel — surfaces §11 of the underwriting policy: the carbon
 * credit revenue stream that accrues to the vault on top of the financing
 * yield. "Double monetization" of every saved kWh.
 */
export function CarbonCreditPanel({
  equipmentType,
  predictedKwhPerYear,
  audienceLabel,
}: CarbonCreditPanelProps) {
  const estimate = estimateCarbon(equipmentType, predictedKwhPerYear);
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-fg-muted">
            Carbon credit revenue
          </div>
          <CardTitle className="text-base">Verified emission reduction</CardTitle>
        </div>
        <Badge
          variant="outline"
          className={
            estimate.eligible
              ? "border-accent/40 bg-accent-soft text-accent-deep text-[10px]"
              : "border-line bg-bg-2 text-fg-muted text-[10px]"
          }
        >
          {estimate.eligible ? "Methodology matched" : "Methodology unmatched"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {estimate.eligible ? (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <KPITile
                label="tCO₂ avoided / yr"
                value={estimate.tCO2PerYear.toFixed(1)}
                sublabel="India grid factor 0.71 tCO₂/MWh"
                status="ok"
              />
              <KPITile
                label="Estimated revenue / yr"
                value={`$${Math.round(estimate.usdPerYear).toLocaleString()}`}
                sublabel={`@ $${CARBON_PRICE_USD_PER_TCO2.toFixed(0)}/tCO₂ (VCM)`}
              />
              <KPITile
                label="Methodology"
                value={
                  <span className="text-sm font-medium">{estimate.methodology}</span>
                }
                sublabel="Pending DOE verification"
              />
            </div>
            <p className="text-xs text-fg-muted">
              Carbon credit revenue accrues to the vault and is distributed{" "}
              {audienceLabel ?? "to LPs"} as supplemental yield, net of platform
              fee.{" "}
              <Link
                href="/docs/underwriting-policy#section-11"
                className="underline underline-offset-2 hover:text-accent"
              >
                See §11 — Carbon credit treatment ↗
              </Link>
            </p>
          </>
        ) : (
          <p className="text-sm text-fg-muted">
            This equipment category does not currently match a verified Verra/Gold
            Standard methodology in our policy. The deal proceeds on energy
            financing alone.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
