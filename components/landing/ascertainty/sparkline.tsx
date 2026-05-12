export function Sparkline({ values, color = "var(--accent)" }: { values: number[]; color?: string }) {
  const w = 72;
  const h = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (values.length - 1)) * w} ${norm(v)}`)
    .join(" ");
  return (
    <svg className="a-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}
