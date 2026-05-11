import BN from "bn.js";

export const USDC_DECIMALS = 6;
export const TOKEN_DECIMALS = 6;
export const PRECISION = new BN("1000000000000"); // 1e12

/** Convert human USDC -> smallest units (BN). */
export function usdcToRaw(n: number | string): BN {
  const val = typeof n === "string" ? parseFloat(n) : n;
  if (!Number.isFinite(val)) return new BN(0);
  return new BN(Math.round(val * 1_000_000));
}

/** Convert raw USDC (BN | string | bigint | number) -> human number string with 6 decimals. */
export function rawToUsdc(raw: BN | string | bigint | number): string {
  const s =
    typeof raw === "bigint"
      ? raw.toString()
      : raw instanceof BN
      ? raw.toString()
      : typeof raw === "number"
      ? Math.trunc(raw).toString()
      : raw;
  if (!s || s === "0") return "0.00";
  const neg = s.startsWith("-");
  const abs = neg ? s.slice(1) : s;
  const padded = abs.padStart(USDC_DECIMALS + 1, "0");
  const intPart = padded.slice(0, -USDC_DECIMALS);
  const fracPart = padded.slice(-USDC_DECIMALS).replace(/0+$/, "");
  return `${neg ? "-" : ""}${intPart}${fracPart ? "." + fracPart : ".00"}`;
}

/** Format a number with thousands separators + fixed decimals. */
export function fmtNumber(n: number | string, decimals = 2): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** USDC amount formatter: always mono, with $ prefix. */
export function fmtUsdc(raw: BN | string | number | bigint): string {
  const h = rawToUsdc(raw);
  return `$${fmtNumber(h, 2)}`;
}

/** Percent (0..100) formatter. */
export function fmtPct(n: number, decimals = 1): string {
  return `${fmtNumber(n, decimals)}%`;
}

/** Short signature "5xR1...abc9". */
export function shortSig(sig: string | undefined | null, n = 8): string {
  if (!sig) return "";
  if (sig.length <= n * 2 + 3) return sig;
  return `${sig.slice(0, n)}...${sig.slice(-n)}`;
}

/** Solana explorer URL for a signature. */
export function explorerTx(sig: string, cluster = "devnet"): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`;
}

/** Solana explorer URL for an account. */
export function explorerAccount(addr: string, cluster = "devnet"): string {
  return `https://explorer.solana.com/address/${addr}?cluster=${cluster}`;
}
