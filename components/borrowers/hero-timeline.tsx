/**
 * Hero sidecar — vertical timeline strip showing the 4–6 week journey.
 * Mirrors the calibrated-PI chart's role in /lenders' hero: a single
 * compact visual that anchors the headline claim. Here the claim is
 * "4–6 weeks to close," and the visual proves it.
 */

const MILESTONES = [
  {
    day: "Day 0",
    title: "Audit + Forecast",
    body: "Site audit feeds the PINN model. Calibrated savings forecast emerges.",
    state: "done" as const,
  },
  {
    day: "Day 14",
    title: "Term sheet signed",
    body: "Facility sized to the P5 floor. Tenor + sculpted amort locked.",
    state: "done" as const,
  },
  {
    day: "Day 21",
    title: "PO + escrow",
    body: "Approved installer engaged. USDC escrowed against milestones.",
    state: "done" as const,
  },
  {
    day: "Day 35",
    title: "Install complete",
    body: "Equipment commissioned. IoT meters online from day one.",
    state: "done" as const,
  },
  {
    day: "Mo 1+",
    title: "M&V tranches",
    body: "Monthly metered savings sculpt the repayment.",
    state: "ongoing" as const,
  },
];

export function HeroTimeline() {
  return (
    <div className="b-hero-timeline" aria-label="4–6 week timeline from audit to first M&V tranche">
      <div className="b-hero-timeline__rail" aria-hidden />
      {MILESTONES.map((m, i) => (
        <div
          key={m.day}
          className={`b-hero-timeline__node b-hero-timeline__node--${m.state}`}
          style={{ animationDelay: `${i * 0.18}s` }}
        >
          <div className="b-hero-timeline__dot" aria-hidden>
            {m.state === "ongoing" ? "●" : "✓"}
          </div>
          <div className="b-hero-timeline__content">
            <div className="b-hero-timeline__day">{m.day}</div>
            <div className="b-hero-timeline__title">{m.title}</div>
            <div className="b-hero-timeline__body">{m.body}</div>
          </div>
        </div>
      ))}
      <div className="b-hero-timeline__caption">
        End-to-end · <span className="b-hero-timeline__caption-strong">4–6 weeks</span>
      </div>
    </div>
  );
}
