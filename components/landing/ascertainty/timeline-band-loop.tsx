"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { SavingsBand } from "@/components/auditor/savings-band";

/**
 * Landing-page hero animation: looping Day 1 → Day 30 band evolution.
 *
 * Reuses the exact same `<SavingsBand>` component that powers the auditor +
 * lender + borrower routes. The animation IS the product, not a mockup.
 *
 * Each frame represents a real PINN snapshot from a simulated 30-day audit.
 * Numbers are hand-fitted to mirror what `seed-timeline-demo.ts` would produce.
 */

interface Frame {
  day: number;
  label: string;
  predicted: number;
  p5: number;
  p95: number;
  grade: "A" | "B" | "C";
}

const FRAMES: Frame[] = [
  { day: 1, label: "Day 1 — spec measurements", predicted: 78_000, p5: 0, p95: 220_000, grade: "C" },
  { day: 5, label: "Day 5 — initial leakage measured", predicted: 115_000, p5: 15_000, p95: 215_000, grade: "C" },
  { day: 10, label: "Day 10 — leakage refined", predicted: 119_913, p5: 29_161, p95: 210_665, grade: "C" },
  { day: 20, label: "Day 20 — plant motor context", predicted: 124_000, p5: 58_000, p95: 190_000, grade: "B" },
  { day: 30, label: "Day 30 — final audit", predicted: 132_000, p5: 91_000, p95: 173_000, grade: "B" },
];

const FRAME_MS = 1800;

export function TimelineBandLoop() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FRAMES.length), FRAME_MS);
    return () => clearInterval(t);
  }, []);
  const frame = FRAMES[idx];

  return (
    <div className="a-timeline-anim">
      <div className="a-timeline-anim__caption">
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: "0.12em", color: "var(--fg-muted)", textTransform: "uppercase" }}>
          Live underwriting band
        </div>
        <p style={{ marginTop: 8 }}>
          As the auditor enters measurements across the 30-day window, the
          model&apos;s uncertainty narrows and the P5 lender floor firms up.
          <br /><br />
          <b>Day 1:</b> we have a wide guess.<br />
          <b>Day 30:</b> the lender has a calibrated floor.<br />
          <span style={{ color: "var(--fg-muted)" }}>That&apos;s the moat.</span>
        </p>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={frame.day}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45 }}
          >
            <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 8, fontFamily: "var(--font-geist-mono)" }}>
              {frame.label}
            </div>
            <SavingsBand
              predictedKwh={frame.predicted}
              p5Kwh={frame.p5}
              p95Kwh={frame.p95}
              grade={frame.grade}
              electricityRateInrKwh={8.66}
              variant="full"
              label="Predicted annual savings"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
