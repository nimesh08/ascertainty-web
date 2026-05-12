/**
 * Demo helpers for carbon credit display per UNDERWRITING_POLICY.md §11.
 *
 * Replace with real Verra/Gold Standard methodology lookup + market price feed
 * when carbon issuance pipeline goes live. Hardcoded constants are flagged so
 * the source of truth is obvious.
 */

// India CEA grid emission factor (2024). Most retrofits displace grid power.
export const INDIA_GRID_TCO2_PER_MWH = 0.71;

// Voluntary carbon market mid-price for energy-efficiency credits.
// Demo constant only — real pricing requires market feed integration.
export const CARBON_PRICE_USD_PER_TCO2 = 8.0;

// Approximate USD->INR for borrower-facing display
export const USD_INR = 84.0;

const CARBON_ELIGIBLE_EQUIPMENT = new Set([
  "compressed_air",
  "motor",
  "motors",
  "lighting",
  "vfd",
  "hvac",
  "refrigeration",
  "fan",
  "pump",
  "chiller",
  "humidification",
]);

const METHODOLOGY_BY_EQUIPMENT: Record<string, string> = {
  compressed_air: "Verra VCS AMS-II.D",
  motor: "Verra VCS AMS-II.D",
  motors: "Verra VCS AMS-II.D",
  lighting: "Gold Standard EE Lighting",
  vfd: "Verra VCS AMS-II.D",
  hvac: "Verra VCS AMS-II.E",
  refrigeration: "Verra VCS AMS-II.D",
  fan: "Verra VCS AMS-II.D",
  pump: "Verra VCS AMS-II.D",
  chiller: "Verra VCS AMS-II.E",
  humidification: "Verra VCS AMS-II.E",
};

export interface CarbonEstimate {
  eligible: boolean;
  tCO2PerYear: number;
  usdPerYear: number;
  inrPerYear: number;
  methodology: string | null;
}

export function estimateCarbon(
  equipmentType: string,
  predictedKwhPerYear: number
): CarbonEstimate {
  const key = equipmentType.toLowerCase();
  const eligible = CARBON_ELIGIBLE_EQUIPMENT.has(key);
  if (!eligible || predictedKwhPerYear <= 0) {
    return {
      eligible: false,
      tCO2PerYear: 0,
      usdPerYear: 0,
      inrPerYear: 0,
      methodology: null,
    };
  }
  const tCO2PerYear = (predictedKwhPerYear / 1000) * INDIA_GRID_TCO2_PER_MWH;
  const usdPerYear = tCO2PerYear * CARBON_PRICE_USD_PER_TCO2;
  return {
    eligible: true,
    tCO2PerYear,
    usdPerYear,
    inrPerYear: usdPerYear * USD_INR,
    methodology: METHODOLOGY_BY_EQUIPMENT[key] ?? "Verra VCS (methodology TBD)",
  };
}
