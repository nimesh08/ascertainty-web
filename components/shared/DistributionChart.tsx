"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DistributionChartProps {
  predictedKwh: number;
  sigmaKwh: number;
  p5Kwh: number;
  p50Kwh?: number;
  p95Kwh: number;
  electricityRateInrKwh?: number;
  height?: number;
}

/**
 * Standard normal PDF.
 */
function normalPdf(x: number, mu: number, sigma: number) {
  if (sigma <= 0) return 0;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/**
 * DistributionChart — recharts AreaChart showing the calibrated Gaussian
 * density of predicted savings. Shaded P5–P95 region highlights the
 * underwriting band; reference lines mark P5 (lender floor), P50, P95.
 */
export function DistributionChart({
  predictedKwh,
  sigmaKwh,
  p5Kwh,
  p50Kwh,
  p95Kwh,
  electricityRateInrKwh = 8.0,
  height = 220,
}: DistributionChartProps) {
  const mu = p50Kwh ?? predictedKwh;
  const sigma = Math.max(sigmaKwh, 1);

  const data = React.useMemo(() => {
    const xMin = Math.max(0, mu - 3 * sigma);
    const xMax = mu + 3 * sigma;
    const points = 80;
    const step = (xMax - xMin) / points;
    const out: Array<{ kwh: number; density: number; bandDensity: number }> = [];
    for (let i = 0; i <= points; i++) {
      const x = xMin + i * step;
      const d = normalPdf(x, mu, sigma);
      const inBand = x >= p5Kwh && x <= p95Kwh;
      out.push({
        kwh: Math.round(x),
        density: d,
        bandDensity: inBand ? d : 0,
      });
    }
    return out;
  }, [mu, sigma, p5Kwh, p95Kwh]);

  const fmtKwh = (n: number) => `${(n / 1000).toFixed(0)}k`;

  // Skip SSR pass — recharts ResponsiveContainer needs DOM measurement
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="w-full min-w-0" style={{ height }} aria-hidden />;
  }

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="kwh"
            tickFormatter={fmtKwh}
            tick={{ fontSize: 10, fill: "var(--fg-muted)" }}
            stroke="var(--line)"
          />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--bg-0)",
              border: "1px solid var(--line)",
              fontSize: 12,
              padding: "6px 10px",
            }}
            // Probability-density values aren't user-meaningful (Gaussian density at
            // a single x-point is ~1e-6 for our kWh scales). Suppress all series
            // values; only the X-axis label (kWh + ₹) carries information.
            formatter={() => null}
            labelFormatter={(label) => {
              const kwh = Number(label) || 0;
              const inRange =
                kwh >= p5Kwh && kwh <= p95Kwh
                  ? "  ·  inside P5–P95 band"
                  : kwh < p5Kwh
                    ? "  ·  below P5 floor"
                    : "  ·  above P95";
              return `${kwh.toLocaleString()} kWh/yr · ≈ ₹${Math.round(kwh * electricityRateInrKwh).toLocaleString("en-IN")}/yr${inRange}`;
            }}
          />
          <Area
            type="monotone"
            dataKey="density"
            stroke="var(--fg-faint)"
            strokeWidth={1}
            fill="transparent"
            name="Density"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="bandDensity"
            stroke="var(--accent)"
            strokeWidth={1.5}
            fill="url(#distFill)"
            name="P5–P95 band"
            isAnimationActive={false}
          />
          <ReferenceLine
            x={p5Kwh}
            stroke="var(--accent-deep)"
            strokeDasharray="4 2"
            label={{ value: "P5", fill: "var(--accent-deep)", fontSize: 10, position: "top" }}
          />
          <ReferenceLine
            x={mu}
            stroke="var(--fg)"
            strokeWidth={1}
            label={{ value: "P50", fill: "var(--fg)", fontSize: 10, position: "top" }}
          />
          <ReferenceLine
            x={p95Kwh}
            stroke="var(--fg-faint)"
            strokeDasharray="4 2"
            label={{ value: "P95", fill: "var(--fg-faint)", fontSize: 10, position: "top" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
