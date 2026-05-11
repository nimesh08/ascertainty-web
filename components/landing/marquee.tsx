"use client";

import { cn } from "@/lib/utils/cn";

const CHAINS: { name: string; color: string }[] = [
  { name: "Solana", color: "#9945FF" },
  { name: "USDC", color: "#2775CA" },
  { name: "Privy", color: "#6E56CF" },
  { name: "Phantom", color: "#AB9FF2" },
  { name: "Helius", color: "#F0B90B" },
  { name: "Anchor", color: "#4ADE80" },
  { name: "Drizzle", color: "#C5F74F" },
  { name: "Next.js", color: "#E8EFE9" },
  { name: "Neon", color: "#00E599" },
];

export function Marquee({ className }: { className?: string }) {
  const items = [...CHAINS, ...CHAINS, ...CHAINS];
  return (
    <div
      className={cn(
        "relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className
      )}
    >
      <div className="flex w-max animate-marquee gap-8 py-2">
        {items.map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="flex shrink-0 items-center gap-2 text-sm text-fg-muted"
          >
            <span
              aria-hidden
              className="block size-2.5 rounded-full"
              style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}66` }}
            />
            <span>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
