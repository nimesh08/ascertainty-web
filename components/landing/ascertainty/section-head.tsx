export function SectionHead({
  title,
  intro,
}: {
  /** Retained for call-site compat; no longer rendered (per design pivot). */
  idx?: string;
  /** Retained for call-site compat; no longer rendered (per design pivot). */
  kicker?: string;
  title: React.ReactNode;
  intro?: string;
}) {
  return (
    <div className="shell">
      <div className="a-section__head">
        <h2 className="a-section__title">{title}</h2>
        {intro && (
          <p style={{ color: "var(--fg-muted)", maxWidth: "60ch", fontSize: 13 }}>
            {intro}
          </p>
        )}
      </div>
    </div>
  );
}
