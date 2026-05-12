"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { generateIoTSeries, summarizeIoTSeries } from "@/lib/demo/iot-mock";
import { KPITile } from "./KPITile";

interface IoTMockChartProps {
  dealId: string;
  annualPredictedKwh: number;
  annualP5Kwh: number;
  annualP95Kwh: number;
  electricityRateInrKwh?: number;
  height?: number;
}

/**
 * IoTMockChart — borrower-facing realized savings vs predicted band.
 * Deterministic per dealId. Mock until M&V hardware is wired; demo chip
 * is set externally by the caller.
 */
export function IoTMockChart({
  dealId,
  annualPredictedKwh,
  annualP5Kwh,
  annualP95Kwh,
  electricityRateInrKwh = 8.0,
  height = 240,
}: IoTMockChartProps) {
  const series = React.useMemo(
    () =>
      generateIoTSeries({
        dealId,
        annualPredictedKwh,
        annualP5Kwh,
        annualP95Kwh,
      }),
    [dealId, annualPredictedKwh, annualP5Kwh, annualP95Kwh]
  );
  const summary = React.useMemo(() => summarizeIoTSeries(series), [series]);

  // Recharts stacked-area trick to render a band: bottom=P5 transparent,
  // upper=(P95-P5) shaded.
  const chartData = React.useMemo(
    () =>
      series.map((p) => ({
        monthLabel: p.monthLabel,
        p5: p.p5Kwh,
        bandHeight: Math.max(0, p.p95Kwh - p.p5Kwh),
        predicted: p.predictedKwh,
        realized: p.realizedKwh,
      })),
    [series]
  );

  return (
    <div className="space-y-4">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 10, fill: "var(--fg-muted)" }}
              stroke="var(--line)"
            />
            <YAxis
              tickFormatter={(n: number) => `${(n / 1000).toFixed(1)}k`}
              tick={{ fontSize: 10, fill: "var(--fg-muted)" }}
              stroke="var(--line)"
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-0)",
                border: "1px solid var(--line)",
                fontSize: 12,
                padding: "6px 10px",
              }}
              formatter={(value, name) => {
                if (name === "P5 (transparent)") return null;
                const n = Number(value);
                if (!Number.isFinite(n)) return null;
                return [`${Math.round(n).toLocaleString()} kWh`, String(name ?? "")];
              }}
            />
            {/* Bottom transparent area pushes the visible band up to P5 */}
            <Area
              type="monotone"
              dataKey="p5"
              stackId="band"
              stroke="transparent"
              fill="transparent"
              name="P5 (transparent)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="bandHeight"
              stackId="band"
              stroke="var(--accent)"
              strokeWidth={1}
              fill="var(--accent)"
              fillOpacity={0.18}
              name="P5–P95 band"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--fg-muted)"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Predicted (P50)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="realized"
              stroke="var(--accent-deep)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--accent-deep)" }}
              name="Realized (meter)"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KPITile
          label="Cumulative kWh saved"
          value={`${Math.round(summary.cumulativeRealized).toLocaleString()} kWh`}
          sublabel={`≈ ₹${Math.round(summary.cumulativeRealized * electricityRateInrKwh).toLocaleString("en-IN")}`}
        />
        <KPITile
          label="vs P5 floor"
          value={`${summary.vsP5Pct >= 0 ? "+" : ""}${summary.vsP5Pct.toFixed(1)}%`}
          status={summary.vsP5Pct >= 0 ? "ok" : "fail"}
          sublabel="Above lender-grade lower bound"
        />
        <KPITile
          label="Months on instrument"
          value={`${summary.monthsOnInstrument}`}
          sublabel="Continuous meter readings"
        />
      </div>
    </div>
  );
}
