"use client";

import { useEffect, useState } from "react";

type Row = { tag: string; color: string; msg: string; amt: string; t?: string };

const EVENT_POOL: Row[] = [
  { tag: "deposit", color: "deposit", msg: "Lender 0x9aa1…42b deposited", amt: "+ $250,000.00 USDC" },
  { tag: "repay", color: "repay", msg: "Tirupur Spinning #042 repaid", amt: "+ $18,427.13 USDC" },
  { tag: "mrv", color: "mrv", msg: "MRV verified · Coimbatore Foundry #028", amt: "kWh −38.4%" },
  { tag: "origin", color: "origin", msg: "Origination signed · Surat Textiles #051", amt: "$1.20M" },
  { tag: "deposit", color: "deposit", msg: "Lender 0xc418…ff0 deposited", amt: "+ $42,000.00 USDC" },
  { tag: "repay", color: "repay", msg: "Morbi Ceramic #017 repaid", amt: "+ $6,902.41 USDC" },
  { tag: "mrv", color: "mrv", msg: "Telemetry stream · NxtGen Bangalore", amt: "PUE 1.18" },
  { tag: "origin", color: "origin", msg: "Underwriting issued · ACMA Pune #061", amt: "BBB+" },
  { tag: "deposit", color: "deposit", msg: "Lender 0xbe33…904 deposited", amt: "+ $1,000,000.00 USDC" },
  { tag: "repay", color: "repay", msg: "VSIP Vietnam #003 repaid", amt: "+ $34,118.00 USDC" },
];

export function TerminalLog() {
  const [rows, setRows] = useState<Row[]>(() => EVENT_POOL.slice(0, 7));
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => {
      setRows((r) => {
        const next = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
        const t = new Date(Date.now() - Math.floor(Math.random() * 60_000));
        return [{ ...next, t: t.toTimeString().slice(0, 8) }, ...r].slice(0, 7);
      });
    }, 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="a-terminal">
      <div className="a-terminal__head">
        <span>// live · base-sepolia · indexer-v3</span>
        <span className="dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
      <div className="a-terminal__body">
        {rows.map((r, i) => (
          <div className={"a-terminal__row" + (i === 0 ? " appear" : "")} key={r.msg + i}>
            <span className="t">
              {mounted ? r.t || new Date(Date.now() - i * 17_000).toTimeString().slice(0, 8) : "—"}
            </span>
            <span className={`tag tag--${r.color}`}>{r.tag}</span>
            <span className="msg">{r.msg}</span>
            <span className="amt num">{r.amt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
