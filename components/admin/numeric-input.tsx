"use client";

import * as React from "react";
import { Input as ShadInput } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<"input">, "value"> & {
  value?: string | number | readonly string[] | unknown;
};

/**
 * `Input` wrapper that accepts `value: unknown` (as emitted by react-hook-form
 * when paired with `zod.coerce.number()` schemas). Coerces the value to a
 * string or number before forwarding to shadcn's `Input`.
 */
export const NumericInput = React.forwardRef<HTMLInputElement, Props>(
  function NumericInput({ value, ...rest }, ref) {
    const coerced =
      value === undefined || value === null
        ? ""
        : typeof value === "number" || typeof value === "string"
        ? value
        : String(value);
    return <ShadInput ref={ref} value={coerced} {...rest} />;
  }
);
