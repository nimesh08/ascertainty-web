export function SectionHead({
  idx,
  kicker,
  title,
  intro,
}: {
  idx: string;
  kicker: string;
  title: React.ReactNode;
  intro?: string;
}) {
  return (
    <div className="shell">
      <div className="a-section__head">
        <div className="a-section__index">
          <b>§ {idx}</b>
          <span>{kicker}</span>
        </div>
        <div>
          <h2 className="a-section__title">{title}</h2>
          {intro && (
            <p style={{ color: "var(--fg-muted)", maxWidth: "60ch", marginTop: 16, fontSize: 13 }}>
              {intro}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
