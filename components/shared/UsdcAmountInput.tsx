"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export interface UsdcAmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}

/**
 * Numeric input for USDC (6 decimals). Accepts only digits and a single
 * decimal separator; clamps the value to `min`/`max` when blurring.
 */
export const UsdcAmountInput = forwardRef<HTMLInputElement, UsdcAmountInputProps>(
  function UsdcAmountInput(
    { value, onChange, min = 0, max = 1_000_000, className, ...rest },
    ref
  ) {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      let raw = e.target.value.replace(/[^\d.]/g, "");
      const firstDot = raw.indexOf(".");
      if (firstDot !== -1) {
        raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
      }
      const [intPart, fracPart] = raw.split(".");
      const cleaned =
        fracPart !== undefined
          ? `${intPart}.${fracPart.slice(0, 6)}`
          : intPart ?? "";
      onChange(cleaned);
    }

    function handleBlur() {
      if (value === "" || value === ".") return;
      const n = Number(value);
      if (!Number.isFinite(n)) return;
      if (n < min) onChange(String(min));
      else if (n > max) onChange(String(max));
    }

    return (
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0.00"
          className="mono-num pr-16 text-right"
          {...rest}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-muted">
          USDC
        </span>
      </div>
    );
  }
);
