"use client";

import { cn } from "@/lib/utils/cn";

interface StatusPillProps {
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({ children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-green/30 bg-green/5 px-3 py-1 text-xs text-fg-muted backdrop-blur",
        className
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-green" />
      </span>
      {children}
    </span>
  );
}
