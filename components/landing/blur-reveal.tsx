"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface BlurRevealProps {
  text: string;
  className?: string;
}

/**
 * Splits text on word boundaries. Segments wrapped between asterisks
 * (e.g. "Finance that *compounds* MSME *savings*") are rendered in the
 * serif italic family with a gradient.
 */
export function BlurReveal({ text, className }: BlurRevealProps) {
  const parts = text.split(/(\*[^*]+\*)/g);
  let wordIndex = 0;

  return (
    <h1 className={cn("font-sans", className)}>
      {parts.map((part, pi) => {
        const isAccent = part.startsWith("*") && part.endsWith("*");
        const clean = isAccent ? part.slice(1, -1) : part;
        const words = clean.split(/(\s+)/);
        return words.map((w, wi) => {
          if (/^\s+$/.test(w)) return <span key={`${pi}-${wi}`}>{w}</span>;
          const index = wordIndex++;
          return (
            <motion.span
              key={`${pi}-${wi}-${index}`}
              initial={{ opacity: 0, filter: "blur(10px)", y: 12 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{
                delay: 0.2 + index * 0.07,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "inline-block",
                isAccent &&
                  "bg-gradient-to-br from-green via-accent to-accent bg-clip-text font-serif italic text-transparent"
              )}
            >
              {w}
            </motion.span>
          );
        });
      })}
    </h1>
  );
}
