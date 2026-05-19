/**
 * Shared label/formatter helpers for ECM equipment types and model attribution.
 * Used by /projects/[id] (investor view) and /lender/[deal_id] (lender brief)
 * so equipment vocabulary + model-name display stay consistent across surfaces.
 */

const EQUIPMENT_PRETTY: Record<string, string> = {
  vfd_pumping: "VFDs / motor controls",
  vfd: "VFDs / motor controls",
  motor: "Motor upgrade",
  cogeneration: "Cogeneration",
  refrigeration: "Refrigeration",
  cold_storage: "Cold storage",
  solar_pv: "Solar PV",
  chiller_hvac: "Chiller / HVAC",
  hvac: "HVAC controls",
  lighting: "LED retrofit",
  led: "LED retrofit",
  compressed_air: "Compressed-air system",
  air_compressor: "Air compressor",
  heat_pump: "Heat pump",
  heat_recovery: "Waste-heat recovery",
  boiler: "Boiler upgrade",
  insulation: "Thermal insulation",
  pump: "Pump upgrade",
  fan: "Fan upgrade",
  humidification: "Humidification system",
  furnace: "Furnace upgrade",
};

export function prettyEquipment(s: string | null | undefined): string {
  if (!s) return "—";
  return EQUIPMENT_PRETTY[s] ?? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const SECTOR_PRETTY: Record<string, string> = {
  textile: "Textile",
  automotive: "Automotive",
  food_processing: "Food processing",
  cold_storage: "Cold storage",
  agriculture: "Agriculture",
  hospitality: "Hospitality",
  chemicals: "Chemicals",
  pharma: "Pharma",
  paper: "Paper",
  plastics: "Plastics",
  foundry: "Foundry",
  steel: "Steel",
};

export function prettySector(s: string | null | undefined): string {
  if (!s) return "—";
  return SECTOR_PRETTY[s] ?? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Numeric sort for ECM rows. `ecm_id` is a text column ("1", "2", ..., "12")
 * to allow non-numeric identifiers in future audits, but string-sort puts
 * "10" before "2". Sort numerically when both are integers; fall back to
 * lexical order otherwise.
 */
export function sortEcmsNumerically<T extends { ecmId: string }>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => {
    const ai = parseInt(a.ecmId, 10);
    const bi = parseInt(b.ecmId, 10);
    if (!Number.isNaN(ai) && !Number.isNaN(bi)) return ai - bi;
    return a.ecmId.localeCompare(b.ecmId);
  });
}

/**
 * Strip version suffix + parenthetical metadata from a model_used string.
 * DB stores "PINN unified (21-feature audit, IN-BEE)" or earlier
 * "PINN unified v0.1 (21-feature audit, IN-BEE)"; public surface uses
 * just "PINN unified".
 */
export function cleanModelName(s: string | null | undefined): string {
  if (!s) return "PINN unified";
  return s
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+v\d+(?:\.\d+)*\s*$/, "")
    .replace(/^exira_pinn_/, "")
    .trim();
}
