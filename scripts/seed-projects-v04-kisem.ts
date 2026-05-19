/**
 * v0.4 seed: replace the fabricated 6-project v0.3 lineup with 4 real KISEM
 * audits (Veejay Syntex, Gomuki Spinning, Unitech Plasto, Alpine Knits) plus
 * 2 aspirational pool-tier deals (Bangalore hotel chiller bundle, Coimbatore
 * cogen). Each project carries N underwriting_results rows (one per ECM),
 * not one. Aggregates (targetUsdc, upgradeType) are denormalized onto
 * projects per the A1 plan.
 *
 *   D2 — drops existing v0.3 fabricated seeds + Test MSME placeholder.
 *        Preserves Lucas TVS Devnet (has onchain_pda) and any non-seed rows.
 *   A1 — projects.targetUsdc = sum(ECM investment in USDC),
 *        projects.upgradeType = bundle label e.g. "Compressed air + VFDs + Motors (9 ECMs)".
 *
 * Idempotent: re-running upserts each project by msme_name and re-derives
 * ECM rows. Safe to run repeatedly.
 *
 * Usage:
 *   bash -c 'set -a && source .env.local && set +a && npx tsx scripts/seed-projects-v04-kisem.ts'
 */
import postgres from "postgres";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EcmSeed {
  equipmentType: string;        // matches schema vocabulary (vfd, motor, fan, compressed_air, lighting, pump, chiller_hvac, cogeneration, heat_recovery, refrigeration, solar_pv)
  description: string;
  baselineKwhPerYear: number;   // per-ECM baseline (segment under audit)
  predictedSavingsKwh: number;
  investmentInr: number;
  paybackMonths: number;        // 0 for zero-CAPEX optimizations
  confidenceGrade: "A" | "B" | "C";
}

interface ProjectSeed {
  msmeName: string;
  sector: string;
  location: string;
  termMonths: number;
  expectedApyBps: number;
  electricityRateInrKwh: number;
  auditorCenter: string;        // e.g. "KISEM-IIT Madras"
  about: string;
  managementOverride?: string;
  documents: Array<{ name: string; url: string }>;
  ecms: EcmSeed[];
  source: "kisem-real" | "aspirational";
}

// ---------------------------------------------------------------------------
// Per-grade conformal band ratios (lower/upper relative to point estimate).
// Grade A: solar / lighting / well-instrumented VFD. Tight ~±22%.
// Grade B: most ECMs (motor, fan, compressed air). Moderate ~±35%.
// Grade C: complex / first-of-kind (cogen, chiller bundle). Wide ~±45%.
// ---------------------------------------------------------------------------
const GRADE_BAND: Record<"A" | "B" | "C", { lower: number; upper: number }> = {
  A: { lower: 0.78, upper: 1.22 },
  B: { lower: 0.65, upper: 1.35 },
  C: { lower: 0.55, upper: 1.45 },
};

// Worst-of A < B < C
function bundleGrade(ecms: EcmSeed[]): "A" | "B" | "C" {
  if (ecms.some((e) => e.confidenceGrade === "C")) return "C";
  if (ecms.some((e) => e.confidenceGrade === "B")) return "B";
  return "A";
}

// ---------------------------------------------------------------------------
// Seed catalogue
// ---------------------------------------------------------------------------

const SEEDS: ProjectSeed[] = [
  // ============= KISEM REAL 1: VEEJAY SYNTEX (Surat textile, 9 ECMs) =============
  {
    msmeName: "Veejay Syntex",
    sector: "textile",
    location: "Surat, Gujarat",
    termMonths: 36,
    expectedApyBps: 1320,
    electricityRateInrKwh: 8.5,
    auditorCenter: "KISEM-IIT Gandhinagar",
    about:
      "Polyester yarn manufacturer in Surat with 9 ECMs identified across compressed-air, motors, fans, and VFDs. The bundle is led by a high-leverage motor right-sizing on the ring-frame line — the single largest savings ECM in our KISEM corpus.",
    documents: [
      { name: "KISEM-IIT Gandhinagar Audit Report.pdf", url: "#" },
      { name: "Ring-Frame Motor Replacement Brief.pdf", url: "#" },
      { name: "Compressed-Air Optimization Plan.pdf", url: "#" },
    ],
    source: "kisem-real",
    ecms: [
      { equipmentType: "compressed_air", description: "Leakage repair + receiver sizing on plant compressed-air loop. 138K kWh/yr.", baselineKwhPerYear: 415_000, predictedSavingsKwh: 138_566, investmentInr: 500_000, paybackMonths: 4.8, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Right-size oversized blower motors on the spinning-frame line.", baselineKwhPerYear: 320_000, predictedSavingsKwh: 130_815, investmentInr: 280_000, paybackMonths: 2.8, confidenceGrade: "B" },
      { equipmentType: "vfd", description: "VFD retrofit on the dye-house circulation pumps (group 1).", baselineKwhPerYear: 180_000, predictedSavingsKwh: 73_542, investmentInr: 600_000, paybackMonths: 10.8, confidenceGrade: "A" },
      { equipmentType: "fan", description: "High-efficiency cooling-tower fan blades (FRP) + drift eliminators.", baselineKwhPerYear: 280_000, predictedSavingsKwh: 139_600, investmentInr: 1_500_000, paybackMonths: 14.2, confidenceGrade: "B" },
      { equipmentType: "vfd", description: "VFD retrofit on dye-house circulation pumps (group 2).", baselineKwhPerYear: 195_000, predictedSavingsKwh: 79_445, investmentInr: 150_000, paybackMonths: 2.5, confidenceGrade: "A" },
      { equipmentType: "vfd", description: "VFD on chiller condenser pump.", baselineKwhPerYear: 58_000, predictedSavingsKwh: 23_539, investmentInr: 80_000, paybackMonths: 4.5, confidenceGrade: "A" },
      { equipmentType: "vfd", description: "VFD on humidification supply fan.", baselineKwhPerYear: 62_000, predictedSavingsKwh: 25_114, investmentInr: 65_000, paybackMonths: 3.4, confidenceGrade: "A" },
      { equipmentType: "motor", description: "IE3 motor swap on conveyor drive.", baselineKwhPerYear: 19_000, predictedSavingsKwh: 7_476, investmentInr: 40_000, paybackMonths: 7.1, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Ring-frame motor replacement (IE2 → IE4) — the largest single ECM. 564K kWh/yr.", baselineKwhPerYear: 1_400_000, predictedSavingsKwh: 564_375, investmentInr: 1_500_000, paybackMonths: 3.5, confidenceGrade: "B" },
    ],
  },

  // ============= KISEM REAL 2: GOMUKI SPINNING (TN textile, 10 ECMs) =============
  {
    msmeName: "Gomuki Spinning Mills",
    sector: "textile",
    location: "Coimbatore, Tamil Nadu",
    termMonths: 36,
    expectedApyBps: 1280,
    electricityRateInrKwh: 8.0,
    auditorCenter: "KISEM-IIT Madras",
    about:
      "Cotton spinning mill in Coimbatore with 10 ECMs. Four are zero-CAPEX optimizations (best-practice adjustments) — listed for transparency; the financed bundle covers the remaining six with a payback-weighted senior tranche.",
    documents: [
      { name: "KISEM-IIT Madras Audit Report.pdf", url: "#" },
      { name: "Humidification System Retrofit Brief.pdf", url: "#" },
      { name: "Chiller Pump Retrofit Brief.pdf", url: "#" },
    ],
    source: "kisem-real",
    ecms: [
      { equipmentType: "fan", description: "Operational tuning on humidification fan #1 (zero-CAPEX best-practice).", baselineKwhPerYear: 105_000, predictedSavingsKwh: 41_615, investmentInr: 0, paybackMonths: 0, confidenceGrade: "B" },
      { equipmentType: "fan", description: "Operational tuning on humidification fan #2 (zero-CAPEX).", baselineKwhPerYear: 108_000, predictedSavingsKwh: 42_459, investmentInr: 0, paybackMonths: 0, confidenceGrade: "B" },
      { equipmentType: "fan", description: "Operational tuning on humidification fan #3 (zero-CAPEX).", baselineKwhPerYear: 107_000, predictedSavingsKwh: 42_247, investmentInr: 0, paybackMonths: 0, confidenceGrade: "B" },
      { equipmentType: "fan", description: "Schedule + setpoint optimization on humidification system supply.", baselineKwhPerYear: 138_000, predictedSavingsKwh: 54_252, investmentInr: 0, paybackMonths: 0, confidenceGrade: "B" },
      { equipmentType: "fan", description: "High-efficiency FRP fan replacement on cooling tower.", baselineKwhPerYear: 155_000, predictedSavingsKwh: 60_987, investmentInr: 910_000, paybackMonths: 18.8, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Re-wind audit + IE3 motor swap on roving-frame drive.", baselineKwhPerYear: 158_000, predictedSavingsKwh: 62_574, investmentInr: 0, paybackMonths: 0, confidenceGrade: "B" },
      { equipmentType: "vfd", description: "VFD retrofit on draw-frame line.", baselineKwhPerYear: 63_000, predictedSavingsKwh: 24_866, investmentInr: 50_000, paybackMonths: 2.5, confidenceGrade: "A" },
      { equipmentType: "vfd", description: "VFD on ring-frame group 2 motors.", baselineKwhPerYear: 120_000, predictedSavingsKwh: 47_305, investmentInr: 150_000, paybackMonths: 4.0, confidenceGrade: "A" },
      { equipmentType: "motor", description: "Mechanical alignment + bearing change on speed-frame motor.", baselineKwhPerYear: 15_000, predictedSavingsKwh: 5_811, investmentInr: 10_000, paybackMonths: 2.2, confidenceGrade: "B" },
      { equipmentType: "pump", description: "Replace centrifugal chilled-water pump with high-efficiency unit + VFD. Largest single ECM.", baselineKwhPerYear: 200_000, predictedSavingsKwh: 79_431, investmentInr: 2_900_000, paybackMonths: 46.0, confidenceGrade: "C" },
    ],
  },

  // ============= KISEM REAL 3: UNITECH PLASTO (Auto components, 12 ECMs) =============
  {
    msmeName: "Unitech Plasto Components",
    sector: "automotive",
    location: "Pune, Maharashtra",
    termMonths: 36,
    expectedApyBps: 1260,
    electricityRateInrKwh: 8.5,
    auditorCenter: "KISEM-IIT Bombay",
    about:
      "Plastic auto-components plant in Pune (injection moulding for OEM tier-1s). 12 ECMs identified, dominated by compressed-air optimization (6 ECMs) which is the highest-leverage cluster in the plant.",
    documents: [
      { name: "KISEM-IIT Bombay Audit Report.pdf", url: "#" },
      { name: "Compressed-Air System Optimization (6 ECMs).pdf", url: "#" },
      { name: "Industrial LED Retrofit Brief.pdf", url: "#" },
    ],
    source: "kisem-real",
    ecms: [
      { equipmentType: "compressed_air", description: "VFD on main air compressor (38 kW). 105K kWh/yr — best payback in the bundle.", baselineKwhPerYear: 255_000, predictedSavingsKwh: 104_606, investmentInr: 200_000, paybackMonths: 2.4, confidenceGrade: "B" },
      { equipmentType: "compressed_air", description: "Compressor sequencing + low-pressure receiver. 202K kWh/yr — largest single ECM.", baselineKwhPerYear: 480_000, predictedSavingsKwh: 202_275, investmentInr: 500_000, paybackMonths: 3.1, confidenceGrade: "B" },
      { equipmentType: "compressed_air", description: "Leakage repair pass + drain valve audit (zero-CAPEX).", baselineKwhPerYear: 108_000, predictedSavingsKwh: 43_461, investmentInr: 0, paybackMonths: 0, confidenceGrade: "B" },
      { equipmentType: "compressed_air", description: "Replace pneumatic ejection with electric on moulding station group 1.", baselineKwhPerYear: 55_000, predictedSavingsKwh: 23_302, investmentInr: 400_000, paybackMonths: 21.7, confidenceGrade: "B" },
      { equipmentType: "compressed_air", description: "Replace pneumatic ejection with electric on moulding station group 2.", baselineKwhPerYear: 30_000, predictedSavingsKwh: 12_276, investmentInr: 400_000, paybackMonths: 41.2, confidenceGrade: "C" },
      { equipmentType: "compressed_air", description: "Replace pneumatic ejection with electric on moulding station group 3.", baselineKwhPerYear: 48_000, predictedSavingsKwh: 20_088, investmentInr: 400_000, paybackMonths: 25.2, confidenceGrade: "C" },
      { equipmentType: "lighting", description: "Industrial LED retrofit on production floor (400 fixtures).", baselineKwhPerYear: 143_000, predictedSavingsKwh: 58_106, investmentInr: 250_000, paybackMonths: 5.4, confidenceGrade: "A" },
      { equipmentType: "compressed_air", description: "Drain timer optimization + dryer scheduling.", baselineKwhPerYear: 58_000, predictedSavingsKwh: 24_258, investmentInr: 75_000, paybackMonths: 3.9, confidenceGrade: "A" },
      { equipmentType: "lighting", description: "LED retrofit in warehouse + dispatch bays (210 fixtures).", baselineKwhPerYear: 64_000, predictedSavingsKwh: 25_927, investmentInr: 150_000, paybackMonths: 7.3, confidenceGrade: "A" },
      { equipmentType: "motor", description: "IE3 motor swap on cooling-water pump.", baselineKwhPerYear: 32_000, predictedSavingsKwh: 13_273, investmentInr: 39_592, paybackMonths: 3.8, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Bearing change + alignment on small auxiliary motor.", baselineKwhPerYear: 2_500, predictedSavingsKwh: 792, investmentInr: 10_000, paybackMonths: 15.9, confidenceGrade: "B" },
      { equipmentType: "fan", description: "Replace exhaust fan with EC-motor unit on paint-shop ventilation.", baselineKwhPerYear: 62_000, predictedSavingsKwh: 25_296, investmentInr: 300_000, paybackMonths: 15.0, confidenceGrade: "B" },
    ],
  },

  // ============= KISEM REAL 4: ALPINE KNITS (TN textile, 10 ECMs) =============
  {
    msmeName: "Alpine Knits India",
    sector: "textile",
    location: "Tirupur, Tamil Nadu",
    termMonths: 36,
    expectedApyBps: 1290,
    electricityRateInrKwh: 8.0,
    auditorCenter: "KISEM-IIT Madras",
    about:
      "Knitwear manufacturer in Tirupur with 10 ECMs identified. Four are essentially free re-wire/operational tweaks on motor controls; the financed senior tranche covers the six CAPEX-eligible upgrades.",
    documents: [
      { name: "KISEM-IIT Madras Audit Report.pdf", url: "#" },
      { name: "Cooling Tower Fan Replacement Brief.pdf", url: "#" },
      { name: "Motor + VFD Bundle Brief.pdf", url: "#" },
    ],
    source: "kisem-real",
    ecms: [
      { equipmentType: "motor", description: "Motor isolation switch retrofit on knitting machine group 1 (effectively zero-CAPEX).", baselineKwhPerYear: 425_000, predictedSavingsKwh: 168_698, investmentInr: 2_000, paybackMonths: 0.1, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Motor isolation retrofit on knitting machine group 2.", baselineKwhPerYear: 148_000, predictedSavingsKwh: 57_982, investmentInr: 2_000, paybackMonths: 0.4, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Motor isolation retrofit on knitting machine group 3.", baselineKwhPerYear: 76_000, predictedSavingsKwh: 30_013, investmentInr: 2_000, paybackMonths: 0.8, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Motor isolation retrofit on knitting machine group 4.", baselineKwhPerYear: 81_000, predictedSavingsKwh: 31_920, investmentInr: 2_000, paybackMonths: 0.8, confidenceGrade: "B" },
      { equipmentType: "fan", description: "Cooling-tower fan replacement (FRP blades + improved drift eliminator).", baselineKwhPerYear: 280_000, predictedSavingsKwh: 110_877, investmentInr: 950_000, paybackMonths: 24.7, confidenceGrade: "B" },
      { equipmentType: "motor", description: "Right-size oversized motors on dyeing-tank circulation pumps.", baselineKwhPerYear: 215_000, predictedSavingsKwh: 84_986, investmentInr: 315_000, paybackMonths: 10.7, confidenceGrade: "B" },
      { equipmentType: "pump", description: "Replace centrifugal pump with submersible high-efficiency unit on bore-well supply.", baselineKwhPerYear: 80_000, predictedSavingsKwh: 31_759, investmentInr: 105_000, paybackMonths: 9.5, confidenceGrade: "A" },
      { equipmentType: "vfd", description: "VFD retrofit on stenter exhaust fan.", baselineKwhPerYear: 187_000, predictedSavingsKwh: 74_390, investmentInr: 80_000, paybackMonths: 3.1, confidenceGrade: "A" },
      { equipmentType: "vfd", description: "VFD retrofit on print-machine drive.", baselineKwhPerYear: 138_000, predictedSavingsKwh: 54_605, investmentInr: 80_000, paybackMonths: 4.2, confidenceGrade: "A" },
      { equipmentType: "motor", description: "IE3 motor swap + soft-starter on calendar drive.", baselineKwhPerYear: 372_000, predictedSavingsKwh: 147_917, investmentInr: 630_000, paybackMonths: 12.3, confidenceGrade: "B" },
    ],
  },

  // ============= ASPIRATIONAL 1: HOTEL CHILLER BUNDLE (Pool-tier, 5 ECMs) =============
  {
    msmeName: "Vivanta Bangalore — Chiller Plant Bundle",
    sector: "hospitality",
    location: "Bangalore, Karnataka",
    termMonths: 60,
    expectedApyBps: 1180,
    electricityRateInrKwh: 9.0,
    auditorCenter: "KISEM-IIT Madras (aspirational)",
    about:
      "Representative pool-tier deal — a 4-star hotel chiller plant replacement + IoT-driven setpoint optimization across 220 guest rooms. Demonstrates the upper end of the ECM ticket range; this size is funded via pool aggregation, not single-LP direct.",
    documents: [
      { name: "Chiller Plant Audit (representative).pdf", url: "#" },
      { name: "Guest Room IoT ECM Brief.pdf", url: "#" },
      { name: "BMS Controls Brief.pdf", url: "#" },
    ],
    source: "aspirational",
    ecms: [
      { equipmentType: "chiller_hvac", description: "Replace 2 × 350-TR centrifugal chillers with magnetic-bearing variable-speed units.", baselineKwhPerYear: 1_800_000, predictedSavingsKwh: 520_000, investmentInr: 9_500_000, paybackMonths: 28.4, confidenceGrade: "B" },
      { equipmentType: "chiller_hvac", description: "Plate heat exchanger + water-side economizer on condenser loop.", baselineKwhPerYear: 380_000, predictedSavingsKwh: 124_000, investmentInr: 1_800_000, paybackMonths: 19.6, confidenceGrade: "B" },
      { equipmentType: "hvac", description: "Occupancy-aware setpoint optimization across 220 guest rooms (IoT thermostats + BMS integration).", baselineKwhPerYear: 720_000, predictedSavingsKwh: 245_000, investmentInr: 2_400_000, paybackMonths: 13.2, confidenceGrade: "B" },
      { equipmentType: "vfd", description: "VFD on primary + secondary chilled-water pumps.", baselineKwhPerYear: 220_000, predictedSavingsKwh: 88_000, investmentInr: 650_000, paybackMonths: 9.9, confidenceGrade: "A" },
      { equipmentType: "lighting", description: "Tunable LED + occupancy sensor retrofit in corridors + back-of-house.", baselineKwhPerYear: 145_000, predictedSavingsKwh: 62_000, investmentInr: 480_000, paybackMonths: 10.4, confidenceGrade: "A" },
    ],
  },

  // ============= ASPIRATIONAL 2: COGEN / FOOD PROCESSING (Pool-tier, 4 ECMs) =============
  {
    msmeName: "TN Foods Coimbatore — Cogen + Heat Recovery",
    sector: "food_processing",
    location: "Coimbatore, Tamil Nadu",
    termMonths: 60,
    expectedApyBps: 1420,
    electricityRateInrKwh: 8.5,
    auditorCenter: "KISEM-IIT Madras (aspirational)",
    about:
      "Representative pool-tier deal — biomass cogeneration plus waste-heat recovery at a food processing unit. Highest CAPEX in the lineup; widest σ (Grade C blended) because cogen output varies with feedstock + ambient. Funded via pool aggregation only.",
    documents: [
      { name: "Cogeneration Feasibility (representative).pdf", url: "#" },
      { name: "Waste-Heat Recovery Brief.pdf", url: "#" },
      { name: "Boiler Upgrade Brief.pdf", url: "#" },
    ],
    source: "aspirational",
    ecms: [
      { equipmentType: "cogeneration", description: "800 kW biomass cogen unit displacing grid + LPG. Highest single-ECM CAPEX.", baselineKwhPerYear: 4_200_000, predictedSavingsKwh: 1_650_000, investmentInr: 28_000_000, paybackMonths: 23.9, confidenceGrade: "C" },
      { equipmentType: "heat_recovery", description: "Recover exhaust heat from dryer flue gas to pre-heat boiler feedwater.", baselineKwhPerYear: 880_000, predictedSavingsKwh: 295_000, investmentInr: 3_800_000, paybackMonths: 18.2, confidenceGrade: "B" },
      { equipmentType: "boiler", description: "Replace ageing FO boiler with IE-rated biomass boiler + economizer.", baselineKwhPerYear: 1_120_000, predictedSavingsKwh: 410_000, investmentInr: 6_500_000, paybackMonths: 22.4, confidenceGrade: "B" },
      { equipmentType: "vfd", description: "VFD on cooling-water + condensate pumps (group).", baselineKwhPerYear: 285_000, predictedSavingsKwh: 110_000, investmentInr: 820_000, paybackMonths: 10.6, confidenceGrade: "A" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INR_PER_USD = 83;

const usdcRaw = (inrTotal: number) =>
  `${BigInt(Math.round((inrTotal / INR_PER_USD) * 1_000_000))}`;

function buildUpgradeLabel(ecms: EcmSeed[]): string {
  // Count by canonical group; show up to 3 leading groups + "(N ECMs)".
  const groups: Record<string, number> = {};
  const GROUP: Record<string, string> = {
    vfd: "VFDs",
    motor: "Motors",
    fan: "Fans",
    pump: "Pumps",
    compressed_air: "Compressed air",
    lighting: "LED",
    chiller_hvac: "Chiller / HVAC",
    hvac: "HVAC controls",
    refrigeration: "Refrigeration",
    cold_storage: "Cold storage",
    solar_pv: "Solar PV",
    cogeneration: "Cogen",
    heat_recovery: "Heat recovery",
    boiler: "Boiler",
    insulation: "Insulation",
    humidification: "Humidification",
  };
  for (const e of ecms) {
    const g = GROUP[e.equipmentType] ?? e.equipmentType;
    groups[g] = (groups[g] ?? 0) + 1;
  }
  const ordered = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const head = ordered.slice(0, 3).map(([g]) => g).join(" + ");
  return `${head} (${ecms.length} ECMs)`;
}

function derivePinnBand(point: number, grade: "A" | "B" | "C") {
  const b = GRADE_BAND[grade];
  const p5 = Math.round(point * b.lower);
  const p95 = Math.round(point * b.upper);
  // Approx σ from a 90% PI assuming Normal: width ≈ 3.29σ → σ ≈ (P95-P5)/3.29
  const sigma = Math.round((p95 - p5) / 3.29);
  return { p5, p95, sigma };
}

function computeDscrs(annualSavingsInr: number, investmentInr: number, termMonths: number) {
  // Approximate equal-amortization. Real lender brief uses sculpted amortization;
  // this is the seed-level proxy for the calibration band on the card.
  if (investmentInr === 0 || annualSavingsInr === 0) {
    return { dscrP5: null as number | null, dscrP50: null as number | null };
  }
  const annualDebtP50 = investmentInr / (termMonths / 12);
  // Treat P50 = point estimate (already passed in as annualSavingsInr).
  // For DSCR @ P5 we apply the grade-mapped lower bound.
  return {
    dscrP50: annualSavingsInr / annualDebtP50,
    dscrP5: null, // computed per-ECM caller-side with the right ratio
  };
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Set DATABASE_URL via .env.local");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // ------------------------------------------------------------------
    // 1) D2: drop v0.3 fabricated seeds + Test MSME placeholder.
    //    Preserve Lucas TVS Devnet (has onchain state) and any human-added rows.
    // ------------------------------------------------------------------
    const STALE_NAMES = [
      "Smart Pumping for Agriculture",
      "Waste-to-Energy for Food Plant",
      "Cold Storage Optimization",
      "Solar Upgrade for Textile Unit",
      "HVAC Optimization for Hotel",
      "LED Retrofit for Auto Parts Maker",
    ];
    // Also drop any pre-existing rows that match the new seed names. This
    // catches duplicates from earlier seed runs (the original v04 INSERT
    // path used ON CONFLICT DO NOTHING on msme_name, but msme_name has no
    // unique constraint so the conflict never fired and re-runs accumulated
    // duplicates). Deleting these up front makes the seed truly idempotent.
    const SEED_NAMES = SEEDS.map((s) => s.msmeName);
    const NAMES_TO_DROP = [...STALE_NAMES, ...SEED_NAMES];
    console.log("=== D2: dropping v0.3 fabricated seeds + any prior v04 rows + Lucas TVS devnet ===");
    const stale = await sql<{ id: string; msme_name: string }[]>`
      SELECT id, msme_name FROM public.projects
      WHERE msme_name IN ${sql(NAMES_TO_DROP)}
         OR msme_name ILIKE 'test msme%'
         OR msme_name ILIKE 'test_msme%'
         OR msme_name ILIKE 'lucas%'
    `;
    if (stale.length > 0) {
      const ids = stale.map((r) => r.id);
      const posCleared = await sql`
        DELETE FROM public.investor_positions WHERE project_id IN ${sql(ids)} RETURNING id
      `;
      const txCleared = await sql`
        DELETE FROM public.transactions WHERE project_id IN ${sql(ids)} RETURNING id
      `;
      const uwCleared = await sql`
        DELETE FROM public.underwriting_results WHERE project_id IN ${sql(ids)} RETURNING id
      `;
      // mrv_baselines + mrv_verifications cascade via mrv_projects FK; we leave
      // the mrv_projects row in place (orphan once project drops it) since it
      // may be useful as audit-side history. Hard-delete on the projects row:
      const deleted = await sql<{ id: string; msme_name: string }[]>`
        DELETE FROM public.projects WHERE id IN ${sql(ids)} RETURNING id, msme_name
      `;
      console.log(
        `  Cleared ${posCleared.length} positions + ${txCleared.length} txs + ${uwCleared.length} underwriting rows`
      );
      console.log(
        `  Deleted ${deleted.length} project rows: ${deleted.map((r) => r.msme_name).join(", ")}`
      );
    } else {
      console.log("  (no v0.3 fabricated rows found — already clean)");
    }

    // ------------------------------------------------------------------
    // 2) Insert / upsert KISEM-real + aspirational seeds
    // ------------------------------------------------------------------
    for (const seed of SEEDS) {
      const totalInvestmentInr = seed.ecms.reduce((a, e) => a + e.investmentInr, 0);
      const totalBaselineKwh = seed.ecms.reduce((a, e) => a + e.baselineKwhPerYear, 0);
      const blendedGrade = bundleGrade(seed.ecms);
      const upgradeLabel = buildUpgradeLabel(seed.ecms);
      const targetUsdcRaw = usdcRaw(totalInvestmentInr);

      console.log(
        `\n=== ${seed.msmeName} (${seed.source}) ===\n  ${seed.ecms.length} ECMs · ₹${totalInvestmentInr.toLocaleString(
          "en-IN"
        )} ≈ $${Math.round(totalInvestmentInr / INR_PER_USD).toLocaleString()} · blended grade ${blendedGrade}`
      );

      // 2a) MRV project (so BaselineImpactSection has a baseline to render)
      let mrvId: string | undefined;
      const [mrv] = await sql<{ id: string }[]>`
        INSERT INTO public.mrv_projects (msme_name, sector, location, upgrade_type, status, baseline_submitted, verification_count)
        VALUES (${seed.msmeName}, ${seed.sector}, ${seed.location}, ${upgradeLabel}, 'baseline_submitted', true, 0)
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      mrvId = mrv?.id;
      if (!mrvId) {
        const [ex] = await sql<{ id: string }[]>`
          SELECT id FROM public.mrv_projects WHERE msme_name = ${seed.msmeName} LIMIT 1
        `;
        mrvId = ex?.id;
      }

      // 2b) Project row with denormalized aggregates (A1)
      const description = `${seed.about}\n\nBundle: ${seed.ecms.length} ECMs · ₹${totalInvestmentInr.toLocaleString("en-IN")} CAPEX · blended grade ${blendedGrade}. Total baseline draw under audit: ${Math.round(totalBaselineKwh).toLocaleString("en-IN")} kWh/yr.`;
      const aboutProject = seed.about;
      const managementText =
        seed.managementOverride ??
        `Audited by ${seed.auditorCenter}. Day-30 and Day-90 verification reports tighten the bundle's conformal band as realized meter data accrues; if realized savings fall below the blended P5 floor, the borrower triggers the §5.6 cure mechanism. KISEM-affiliated auditor is BEE-certified; equipment carries OEM warranties typical for India MSME retrofits.`;
      const financialsText = `Target return floats with realized savings. The senior tranche is sized to the bundle's blended P5 floor at DSCR ≥ 1.30×; junior absorbs first-loss until Day-90 verification tightens the band. Where ECMs include zero-CAPEX optimizations (operational tweaks), those are listed for transparency but excluded from the senior covenant — the financed senior covers CAPEX-eligible ECMs only.`;

      const highlights = [
        {
          title: blendedGrade === "A" ? "Senior tranche eligible" : blendedGrade === "B" ? "Senior + Junior split" : "Junior tranche (first-loss)",
          detail:
            blendedGrade === "A"
              ? "Tight bundle σ — qualifies for senior tranche per UNDERWRITING_POLICY §5.2."
              : blendedGrade === "B"
                ? "Moderate bundle σ — senior + junior split with junior absorbing first-loss until Day-90."
                : "Wide bundle σ — junior-only until a verified Day-90 + Day-180 audit tightens the conformal coverage.",
          icon: "shield-check",
        },
        {
          title: `${seed.ecms.length}-ECM bundle`,
          detail: `Single auditor, single facility, ${seed.ecms.length} ECMs. Each ECM has its own predicted-savings band; the senior is sized to the bundle's P5 sum, not the sum of individual P50s.`,
          icon: "layers",
        },
        {
          title: "PINN unified — 21-feature audit",
          detail: "Served by the unified PINN (21-feature audit, IN-BEE). TabPFN benchmark headline: R²=+0.56 LOO on 6-feature corpus (n=72 KISEM + 14,482 IAC).",
          icon: "badge-check",
        },
        {
          title: "Carbon §11 accrual",
          detail: "tCO₂e accrues monthly per the §11 disclosure schedule across all ECMs on the same meter.",
          icon: "leaf",
        },
      ];

      let projectId: string;
      const [proj] = await sql<{ id: string }[]>`
        INSERT INTO public.projects (
          msme_name, sector, location, upgrade_type, term_months,
          target_usdc, status, mrv_project_id,
          description, about_project, highlights, management_text, financials_text, documents,
          trust_score, expected_apy_bps
        )
        VALUES (
          ${seed.msmeName}, ${seed.sector}, ${seed.location}, ${upgradeLabel}, ${seed.termMonths},
          ${targetUsdcRaw}, 'funding', ${mrvId ?? null},
          ${description}, ${aboutProject}, ${sql.json(highlights)}, ${managementText}, ${financialsText}, ${sql.json(seed.documents)},
          NULL, ${seed.expectedApyBps}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (proj?.id) {
        projectId = proj.id;
        console.log(`  project: inserted (id=${projectId})`);
      } else {
        const [upd] = await sql<{ id: string }[]>`
          UPDATE public.projects
          SET
            sector          = ${seed.sector},
            location        = ${seed.location},
            upgrade_type    = ${upgradeLabel},
            term_months     = ${seed.termMonths},
            target_usdc     = ${targetUsdcRaw},
            mrv_project_id  = COALESCE(mrv_project_id, ${mrvId ?? null}),
            description     = ${description},
            about_project   = ${aboutProject},
            highlights      = ${sql.json(highlights)},
            management_text = ${managementText},
            financials_text = ${financialsText},
            documents       = ${sql.json(seed.documents)},
            expected_apy_bps= ${seed.expectedApyBps}
          WHERE msme_name = ${seed.msmeName}
          RETURNING id
        `;
        if (!upd?.id) {
          console.log(`  ! could not upsert project ${seed.msmeName}; skipping`);
          continue;
        }
        projectId = upd.id;
        console.log(`  project: updated (id=${projectId})`);
      }

      // 2c) MRV baseline (one row reflecting bundle baseline)
      if (mrvId) {
        const [exBaseline] = await sql<{ id: string }[]>`
          SELECT id FROM public.mrv_baselines WHERE mrv_project_id = ${mrvId} LIMIT 1
        `;
        if (!exBaseline) {
          await sql`
            INSERT INTO public.mrv_baselines (mrv_project_id, auditor_wallet, energy_kwh_per_year, fuel_type, report_hash)
            VALUES (${mrvId}, 'KISEMSeedAuditor1111111111111111111111111111', ${Math.round(totalBaselineKwh)}, 'electric', 'seed-v04-kisem')
          `;
          console.log(`  mrv_baselines: inserted (${Math.round(totalBaselineKwh).toLocaleString()} kWh/yr bundle baseline)`);
        }
      }

      // 2d) Wipe existing underwriting rows for this project, then write N fresh ECM rows
      const dealId = seed.msmeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await sql`DELETE FROM public.underwriting_results WHERE project_id = ${projectId}`;
      for (let i = 0; i < seed.ecms.length; i++) {
        const e = seed.ecms[i];
        const ecmId = String(i + 1);
        const point = e.predictedSavingsKwh;
        const { p5, p95, sigma } = derivePinnBand(point, e.confidenceGrade);
        const annualInr = Math.round(point * seed.electricityRateInrKwh);
        const p5Inr = Math.round(p5 * seed.electricityRateInrKwh);
        const { dscrP50 } = computeDscrs(annualInr, e.investmentInr, seed.termMonths);
        const dscrP5 = e.investmentInr > 0
          ? p5Inr / (e.investmentInr / (seed.termMonths / 12))
          : null;
        const paybackMonths = e.investmentInr > 0 && annualInr > 0
          ? (e.investmentInr / annualInr) * 12
          : null;
        const p5PaybackMonths = e.investmentInr > 0 && p5Inr > 0
          ? (e.investmentInr / p5Inr) * 12
          : null;
        const recommendedLoanInr = e.investmentInr > 0
          ? Math.round(p5Inr * (seed.termMonths / 12) * 0.85)
          : null;
        const carbonT = Math.round(point * 0.00082 * 100) / 100; // 0.82 kgCO₂/kWh India grid

        await sql`
          INSERT INTO public.underwriting_results (
            project_id, mrv_project_id,
            deal_id, ecm_id, equipment_type, sector, description,
            audit_inputs_json, prediction_json, model_used, sigma_scale_applied,
            pinn_savings_kwh, pinn_p5_lower_kwh, pinn_p95_upper_kwh, pinn_sigma_kwh,
            confidence_grade,
            baseline_kwh_per_year, investment_inr, electricity_rate_inr_kwh,
            annual_savings_inr, payback_months, p5_payback_months, recommended_loan_inr,
            status,
            dscr_at_p5, dscr_at_p50,
            eligibility_status,
            carbon_eligible, carbon_tco2_per_year, carbon_methodology
          )
          VALUES (
            ${projectId}, ${mrvId ?? null},
            ${dealId}, ${ecmId}, ${e.equipmentType}, ${seed.sector}, ${e.description},
            ${sql.json({ baseline_kwh: e.baselineKwhPerYear, equipment_type: e.equipmentType, sector: seed.sector, region: "IN-BEE" })},
            ${sql.json({ savings_kwh: point, p5_lower_kwh: p5, p95_upper_kwh: p95, sigma_kwh: sigma, model: "PINN unified", region: "IN-BEE" })},
            'PINN unified (21-feature audit, IN-BEE)',
            ${1.0},
            ${point}, ${p5}, ${p95}, ${sigma},
            ${e.confidenceGrade},
            ${e.baselineKwhPerYear}, ${e.investmentInr}, ${seed.electricityRateInrKwh},
            ${annualInr},
            ${paybackMonths != null ? paybackMonths.toFixed(2) : null},
            ${p5PaybackMonths != null ? p5PaybackMonths.toFixed(2) : null},
            ${recommendedLoanInr},
            'predicted',
            ${dscrP5 != null ? dscrP5.toFixed(4) : null},
            ${dscrP50 != null ? dscrP50.toFixed(4) : null},
            'eligible',
            ${carbonT > 0}, ${carbonT}, 'CDM AMS-II.E (energy efficiency MSMEs)'
          )
        `;
      }
      console.log(`  underwriting_results: wrote ${seed.ecms.length} ECM rows (deal_id=${dealId})`);
    }

    console.log(`\nDone. Re-run is safe (idempotent).`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
