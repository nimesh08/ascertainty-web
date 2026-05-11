/**
 * Small decoding helpers shared across sync modules.
 *
 * These normalise the various shapes Anchor hands back from
 * `program.account.<name>.all()`:
 *   - BN objects for u64/u128 -> string (so Postgres numeric is happy)
 *   - PublicKey -> base58 string
 *   - Fixed-length byte arrays padded with \0 or 0x20 -> trimmed UTF-8 strings
 *   - Anchor enum discriminator object -> lowercase variant key
 *   - i64 unix seconds -> Date (or null if 0)
 */

import { PublicKey } from "@solana/web3.js";

type BNLike = { toString(radix?: number): string };

export function bnToString(v: unknown): string {
  if (v === null || v === undefined) return "0";
  if (typeof v === "string") return v;
  if (typeof v === "number") return v.toString();
  if (typeof v === "bigint") return v.toString();
  const maybe = v as BNLike;
  if (typeof maybe.toString === "function") return maybe.toString();
  return "0";
}

export function bnToBigint(v: unknown): bigint {
  if (v === null || v === undefined) return 0n;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") return BigInt(v);
  return BigInt((v as BNLike).toString());
}

export function bnToNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  return Number((v as BNLike).toString());
}

export function pkToString(v: unknown): string {
  if (v instanceof PublicKey) return v.toBase58();
  if (typeof v === "string") return v;
  if (v && typeof (v as { toBase58?: () => string }).toBase58 === "function") {
    return (v as { toBase58: () => string }).toBase58();
  }
  return String(v);
}

/**
 * Decode a fixed-length `[u8; N]` name-style field into a trimmed UTF-8 string.
 * Anchor surfaces these as either a `Uint8Array`, a `Buffer`, or a plain
 * `number[]`; we normalise all three.
 */
export function fixedBytesToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  let arr: Uint8Array;
  if (v instanceof Uint8Array) arr = v;
  else if (Array.isArray(v)) arr = Uint8Array.from(v as number[]);
  else if (typeof v === "string") return v.replace(/\0+$/g, "").trim();
  else return "";
  let end = arr.length;
  while (end > 0 && (arr[end - 1] === 0 || arr[end - 1] === 0x20)) end--;
  return new TextDecoder("utf-8").decode(arr.subarray(0, end));
}

/**
 * Convert a 32-byte report-hash array to a lowercase hex string
 * (no `0x` prefix). Returns null for empty / unset hashes.
 */
export function bytesToHex(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  let arr: Uint8Array;
  if (v instanceof Uint8Array) arr = v;
  else if (Array.isArray(v)) arr = Uint8Array.from(v as number[]);
  else return null;
  if (arr.length === 0) return null;
  let allZero = true;
  for (const b of arr) if (b !== 0) { allZero = false; break; }
  if (allZero) return null;
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Anchor encodes enums as objects of shape `{ variantName: {} }`.
 * Returns the lowercased variant key (e.g. `Funding` -> `funding`), or null
 * when the input is null/unknown.
 */
export function enumKey(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const keys = Object.keys(v as Record<string, unknown>);
  if (keys.length === 0) return null;
  return keys[0].toLowerCase();
}

export function bool(v: unknown): boolean {
  return Boolean(v);
}

/**
 * Convert an i64 unix-seconds timestamp to a `Date`, or null if falsy/zero.
 */
export function tsToDate(v: unknown): Date | null {
  const n = bnToNumber(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000);
}
