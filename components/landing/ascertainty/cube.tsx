"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Face = {
  code: string;
  title: string;
  desc: string;
  rows: Array<[string, string]>;
};

type Meaning = "protocol" | "capital" | "asset";

export const CUBE_MEANINGS: Record<Meaning, { label: string; faces: Face[] }> = {
  protocol: {
    label: "Protocol Layers",
    faces: [
      { code: "01", title: "Origination", desc: "MSME + DC borrowers sourced via KISEM, ACMA, VITAS, KADIN networks.", rows: [["Pipeline", "$240M"], ["Active deals", "37"], ["Regions", "IN · ID · VN"]] },
      { code: "02", title: "Underwriting", desc: "PINN-based thermal & cash-flow models. Audit baselines on-chain.", rows: [["Risk model", "PINN v3"], ["Auditors", "BEE · TÜV"], ["Avg. tier", "BBB+"]] },
      { code: "03", title: "Vaults", desc: "ERC-7540 async vaults. Per-tranche redemption. Composable shares.", rows: [["Standard", "7540 / 3643"], ["Tranches", "SR / JR"], ["Chains", "BASE · ETH"]] },
      { code: "04", title: "Compliance", desc: "ERC-3643 permissioned tokens. Sumsub KYC. Chainalysis KYT.", rows: [["KYC", "Sumsub"], ["AML", "Chainalysis"], ["IDs", "ONCHAINID"]] },
      { code: "05", title: "Settlement", desc: "USDC on Base, pUSD on Plume, XSGD for MAS-supervised SG corridor.", rows: [["Primary", "USDC"], ["SG corridor", "XSGD"], ["Latency", "< 4s"]] },
      { code: "06", title: "Telemetry", desc: "On-site IoT energy meters stream kWh deltas. Covenants verify in real time.", rows: [["Meters", "1,240"], ["Stream", "30s"], ["Verified", "98.4%"]] },
    ],
  },
  capital: {
    label: "Capital Flow",
    faces: [
      { code: "01", title: "Deposit", desc: "Lender wires USDC. Receives exiraUSDC share token — yield-bearing.", rows: [["Min. ticket", "$10K"], ["Lock-up", "0–24mo"], ["Token", "exiraUSDC"]] },
      { code: "02", title: "Underwrite", desc: "Risk engine assigns tranche, sizes facility, attaches MRV covenants.", rows: [["TTL", "72h"], ["Granularity", "Per-deal"], ["Override", "Multisig"]] },
      { code: "03", title: "Originate", desc: "Borrower receives stablecoin. Equipment ships. Audit baseline captured.", rows: [["FX hop", "Direct"], ["KYC", "Pre-cleared"], ["Wallet", "Privy"]] },
      { code: "04", title: "Operate", desc: "Asset runs. Energy savings measured. Cash flows reconcile against forecast.", rows: [["Tenor", "1–7yr"], ["IRR (est.)", "12–18%"], ["Sensor", "On-chain"]] },
      { code: "05", title: "Repay", desc: "Borrower repays stablecoin from saved cashflow. Pro-rata distributions.", rows: [["Cadence", "Monthly"], ["Currency", "USDC"], ["DSCR", "1.42×"]] },
      { code: "06", title: "Redeem", desc: "Lender burns shares for principal + accrued. Async redemption queue clears.", rows: [["Window", "Weekly"], ["Notice", "T+0"], ["Net APY", "11.8%"]] },
    ],
  },
  asset: {
    label: "Asset Classes",
    faces: [
      { code: "V1", title: "Energy Efficiency", desc: "LED, HVAC, VFD, solar, steam, power factor. $50K–$2M tickets. 1–7yr.", rows: [["Tickets", "$50K–2M"], ["Payback", "1–7yr"], ["Pipeline", "$96M"]] },
      { code: "V2", title: "Cooling Retrofit", desc: "Direct-to-chip liquid, immersion, cold storage. PINN-verified efficiency.", rows: [["Density", "30kW+/rack"], ["Payback", "1.8–4.5yr"], ["Pipeline", "$78M"]] },
      { code: "V2", title: "AI Compute", desc: "SME GPU clusters & regional neocloud racks. Co-financed with USD.AI peers.", rows: [["Tickets", "$2–20M"], ["Payback", "14–36mo"], ["Pipeline", "$42M"]] },
      { code: "V3", title: "Adjacent Industrial", desc: "OSAT, cleanroom leasing, EV charging, battery, waste heat, water.", rows: [["Tickets", "$0.5–20M"], ["Sectors", "8"], ["Pipeline", "$24M"]] },
      { code: "OFF", title: "Excluded", desc: "Hyperscale DCs, semiconductor fabs, utility-scale solar — already capitalised.", rows: [["Reason", "ISM 2.0"], ["Reason", "C-PACE"], ["Reason", "Hyperscale"]] },
      { code: "MAP", title: "Geographic Stack", desc: "India wedge → Indonesia + Vietnam → Wider SEA. Singapore as regulatory HQ.", rows: [["Phase 1", "India"], ["Phase 2", "ID + VN"], ["HQ", "Singapore"]] },
    ],
  },
};

const FACE_NAMES = ["front", "back", "right", "left", "top", "bottom"] as const;

type CubeProps = {
  meaning?: Meaning;
  onFaceFocus?: (i: number) => void;
};

export function Cube({ meaning = "protocol", onFaceFocus }: CubeProps) {
  const data = CUBE_MEANINGS[meaning] || CUBE_MEANINGS.protocol;
  const [rot, setRot] = useState({ x: -18, y: 24 });
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const stateRef = useRef({
    idle: true,
    dragging: false,
    rx: -18,
    ry: 24,
    vx: 0,
    vy: 0,
    target: null as null | { x: number; y: number },
  });
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const s = stateRef.current;
      if (s.target) {
        s.rx += (s.target.x - s.rx) * 0.12;
        s.ry += (s.target.y - s.ry) * 0.12;
        if (Math.abs(s.target.x - s.rx) < 0.2 && Math.abs(s.target.y - s.ry) < 0.2) {
          s.rx = s.target.x;
          s.ry = s.target.y;
          s.target = null;
        }
      } else if (s.idle && !s.dragging) {
        s.ry += 0.06 * (dt / 16);
        s.rx += Math.sin(now / 2400) * 0.012;
      } else if (!s.dragging) {
        s.rx += s.vx * (dt / 16);
        s.ry += s.vy * (dt / 16);
        s.vx *= 0.94;
        s.vy *= 0.94;
        if (Math.abs(s.vx) < 0.01 && Math.abs(s.vy) < 0.01) {
          s.vx = 0;
          s.vy = 0;
          s.idle = true;
        }
      }
      setRot({ x: s.rx, y: s.ry });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = cubeRef.current;
    if (!el) return;
    let lastX = 0;
    let lastY = 0;
    const down = (e: PointerEvent) => {
      stateRef.current.dragging = true;
      stateRef.current.idle = false;
      stateRef.current.target = null;
      setDragging(true);
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!stateRef.current.dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      stateRef.current.ry += dx * 0.5;
      stateRef.current.rx -= dy * 0.5;
      stateRef.current.vx = -dy * 0.05;
      stateRef.current.vy = dx * 0.05;
    };
    const up = (e: PointerEvent) => {
      stateRef.current.dragging = false;
      setDragging(false);
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  const focusFace = useCallback(
    (i: number) => {
      const targets = [
        { x: -10, y: 24 },
        { x: -10, y: 204 },
        { x: -10, y: -66 },
        { x: -10, y: 114 },
        { x: -80, y: 24 },
        { x: 80, y: 24 },
      ];
      stateRef.current.target = targets[i];
      stateRef.current.idle = false;
      setActive(i);
      onFaceFocus?.(i);
    },
    [onFaceFocus]
  );

  return (
    <div className="a-cube-stage">
      <div className="a-cube-stage__rings"></div>
      <div className="a-cube-stage__crosshair"></div>
      <div
        ref={cubeRef}
        className={"a-cube" + (dragging ? " dragging" : "")}
        style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
      >
        {data.faces.map((face, i) => (
          <div
            key={i}
            className={`a-cube__face a-cube__face--${FACE_NAMES[i]}`}
            data-active={active === i}
            onClick={(e) => {
              e.stopPropagation();
              focusFace(i);
            }}
          >
            <div className="a-cube__face-head">
              <span>FACE / {FACE_NAMES[i].toUpperCase()}</span>
              <b>{face.code}</b>
            </div>
            <h4 className="a-cube__face-title">{face.title}</h4>
            <p className="a-cube__face-desc">{face.desc}</p>
            <div className="a-cube__face-rows">
              {face.rows.map(([k, v], j) => (
                <div key={j}>
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CubeLegend({
  active,
  onFocus,
  meaning,
}: {
  active: number;
  onFocus: (i: number) => void;
  meaning: Meaning;
}) {
  const data = CUBE_MEANINGS[meaning] || CUBE_MEANINGS.protocol;
  return (
    <div className="a-cube-legend" style={{ marginInline: "auto" }}>
      {data.faces.map((face, i) => (
        <button key={i} onClick={() => onFocus(i)} aria-pressed={active === i}>
          <b>
            {FACE_NAMES[i]} · {face.code}
          </b>
          {face.title}
        </button>
      ))}
    </div>
  );
}
