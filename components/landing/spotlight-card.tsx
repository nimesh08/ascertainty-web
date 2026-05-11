"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spotlight-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spotlight-y", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn(
        "spotlight-card relative rounded-xl border bg-card text-card-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
