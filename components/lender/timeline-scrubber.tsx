"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { SavingsBand } from "@/components/auditor/savings-band";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Snapshot {
  id: string;
  day: number | null;
  label: string | null;
  predicted_kwh: number;
  p5_kwh: number;
  p95_kwh: number;
  sigma_kwh: number;
  grade: "A" | "B" | "C" | null;
  model_used: string | null;
  snapshot_at: string;
}

interface Props {
  dealId: string;
  snapshots: Snapshot[];
  electricityRateInrKwh: number;
}

const PLAY_INTERVAL_MS = 1200;

export function TimelineScrubber({ snapshots, electricityRateInrKwh }: Props) {
  const sorted = useMemo(
    () =>
      [...snapshots].sort((a, b) => {
        if (a.day != null && b.day != null) return a.day - b.day;
        return new Date(a.snapshot_at).getTime() - new Date(b.snapshot_at).getTime();
      }),
    [snapshots]
  );

  const [index, setIndex] = useState(sorted.length - 1);
  const [playing, setPlaying] = useState(false);

  // Auto-advance when "playing"
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setIndex((i) => {
        if (i >= sorted.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(t);
  }, [playing, sorted.length]);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No snapshots yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fg-muted">
            As the auditor enters measurements over Day 1 → Day 30, snapshots
            will appear here showing how the prediction tightens. The lender
            sees the P5 floor firm up in real time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cur = sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  const dayLabel =
    cur.day != null
      ? `Day ${cur.day}`
      : new Date(cur.snapshot_at).toLocaleString();
  const firstP5 = sorted[0].p5_kwh;
  const curP5 = cur.p5_kwh;
  const deltaP5Pct = firstP5 > 0 ? ((curP5 - firstP5) / firstP5) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Current snapshot band */}
      <motion.div
        key={cur.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <CardTitle className="text-base">
                {dayLabel}
                {cur.label && (
                  <span className="ml-2 text-sm font-normal text-fg-muted">
                    · {cur.label}
                  </span>
                )}
              </CardTitle>
              <span className="text-xs text-fg-muted">
                snapshot {index + 1} / {sorted.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <SavingsBand
              predictedKwh={cur.predicted_kwh}
              p5Kwh={cur.p5_kwh}
              p95Kwh={cur.p95_kwh}
              grade={cur.grade ?? undefined}
              electricityRateInrKwh={electricityRateInrKwh}
              label="Prediction at this snapshot"
            />
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                <div className="text-zinc-500">Model</div>
                <div className="font-mono">{cur.model_used ?? "—"}</div>
              </div>
              <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                <div className="text-zinc-500">σ at this snapshot</div>
                <div>
                  ±{cur.sigma_kwh.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                  kWh/yr
                </div>
              </div>
              <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                <div className="text-zinc-500">P5 vs Day-1 floor</div>
                <div
                  className={
                    deltaP5Pct >= 0
                      ? "font-medium text-emerald-700 dark:text-emerald-300"
                      : "text-rose-600"
                  }
                >
                  {deltaP5Pct >= 0 ? "+" : ""}
                  {deltaP5Pct.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scrubber + play controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scrub the audit timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="range"
            min={0}
            max={sorted.length - 1}
            value={index}
            onChange={(e) => {
              setPlaying(false);
              setIndex(Number(e.target.value));
            }}
            className="w-full accent-emerald-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-fg-muted">
              {sorted[0].day != null
                ? `Day ${sorted[0].day}`
                : "Start"}{" "}
              →{" "}
              {sorted[sorted.length - 1].day != null
                ? `Day ${sorted[sorted.length - 1].day}`
                : "Latest"}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIndex(0);
                  setPlaying(true);
                }}
              >
                ▶ Replay
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPlaying(false);
                  setIndex(sorted.length - 1);
                }}
              >
                Latest
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini-list of all snapshots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All snapshots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="py-1 text-left">When</th>
                  <th className="py-1 text-right">Point</th>
                  <th className="py-1 text-right">P5</th>
                  <th className="py-1 text-right">σ</th>
                  <th className="py-1 text-right">Grade</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => {
                      setPlaying(false);
                      setIndex(i);
                    }}
                    className={`cursor-pointer border-t border-line/60 hover:bg-bg-2/60 ${
                      i === index ? "bg-emerald-50 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    <td className="py-1">
                      {s.day != null ? `Day ${s.day}` : new Date(s.snapshot_at).toLocaleString()}
                      {s.label && (
                        <span className="ml-2 text-xs text-fg-muted">· {s.label}</span>
                      )}
                    </td>
                    <td className="py-1 text-right">
                      {s.predicted_kwh.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-1 text-right text-emerald-700 dark:text-emerald-300">
                      {s.p5_kwh.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-1 text-right">
                      ±{s.sigma_kwh.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-1 text-right">{s.grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
