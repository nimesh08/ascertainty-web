/**
 * Deterministic IoT M&V mock — generates a 12-month realized-savings trace
 * inside the predicted P5–P95 band.
 *
 * Same `dealId` always returns same trace so reload-stable for demo.
 * Replace with real meter ingestion when M&V pipeline is wired.
 */

// Mulberry32 — small fast PRNG seeded from a 32-bit integer
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface IoTSeriesPoint {
  month: number; // 1-indexed
  monthLabel: string;
  predictedKwh: number; // monthly P50 (annual P50 / 12)
  p5Kwh: number; // monthly P5
  p95Kwh: number; // monthly P95
  realizedKwh: number; // simulated meter reading
}

export interface IoTSeriesParams {
  dealId: string;
  annualPredictedKwh: number;
  annualP5Kwh: number;
  annualP95Kwh: number;
  months?: number;
}

/**
 * Generates a monthly time-series with random walk inside the band.
 * Mild seasonality: dips in May/June (monsoon factory load), peaks in Q3/Q4.
 */
export function generateIoTSeries(params: IoTSeriesParams): IoTSeriesPoint[] {
  const months = params.months ?? 12;
  const rng = mulberry32(hashString(params.dealId));

  const monthlyP50 = params.annualPredictedKwh / 12;
  const monthlyP5 = params.annualP5Kwh / 12;
  const monthlyP95 = params.annualP95Kwh / 12;
  const halfBand = (monthlyP95 - monthlyP5) / 2;

  // Center the realized walk slightly above P50 to suggest "model under-predicting"
  // narrative (positive surprise), which is the friendly demo case.
  let level = monthlyP50 * 1.02;

  const seasonal = (m: number) => {
    // Indian factory seasonality: dip May-Jun, peak Oct-Dec
    const phase = ((m - 1) / 12) * Math.PI * 2;
    return Math.sin(phase + 1.5) * 0.04; // ±4%
  };

  const labels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const points: IoTSeriesPoint[] = [];
  for (let m = 1; m <= months; m++) {
    // Random walk step, bounded
    const step = (rng() - 0.5) * halfBand * 0.4;
    level += step;
    // Mean-reversion to P50 to keep the line inside the band
    level = level + (monthlyP50 - level) * 0.15;
    // Apply seasonality
    const realized = level * (1 + seasonal(m));
    // Clamp inside [P5, P95] for visual integrity
    const clamped = Math.max(monthlyP5, Math.min(monthlyP95, realized));

    points.push({
      month: m,
      monthLabel: labels[(m - 1) % 12],
      predictedKwh: monthlyP50,
      p5Kwh: monthlyP5,
      p95Kwh: monthlyP95,
      realizedKwh: clamped,
    });
  }
  return points;
}

export function summarizeIoTSeries(series: IoTSeriesPoint[]) {
  const cumulativeRealized = series.reduce((a, p) => a + p.realizedKwh, 0);
  const cumulativeP5 = series.reduce((a, p) => a + p.p5Kwh, 0);
  const cumulativePredicted = series.reduce((a, p) => a + p.predictedKwh, 0);
  const vsP5Pct = cumulativeP5 > 0 ? (cumulativeRealized / cumulativeP5 - 1) * 100 : 0;
  const vsPredictedPct =
    cumulativePredicted > 0 ? (cumulativeRealized / cumulativePredicted - 1) * 100 : 0;
  return {
    cumulativeRealized,
    cumulativeP5,
    cumulativePredicted,
    vsP5Pct,
    vsPredictedPct,
    monthsOnInstrument: series.length,
  };
}
