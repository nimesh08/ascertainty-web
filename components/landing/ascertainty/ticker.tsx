export type TickerItem = { k: string; v: string; d: number; dl: string };

export function Ticker({ items }: { items: TickerItem[] }) {
  return (
    <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", overflow: "hidden", background: "var(--bg-1)" }}>
      <div className="a-ticker" style={{ padding: "12px 0" }}>
        {[...items, ...items].map((it, i) => (
          <div className="a-ticker__row" key={i}>
            <span>{it.k}</span>
            <span className="num">{it.v}</span>
            <span className={it.d > 0 ? "delta-up" : it.d < 0 ? "delta-down" : ""}>
              {it.d > 0 ? "▲" : it.d < 0 ? "▼" : "·"} {it.dl}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
