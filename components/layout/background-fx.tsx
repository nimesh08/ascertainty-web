"use client";

export function BackgroundFX() {
  // Light-mode engineering grid: faint dots + soft verdigris glow.
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: "var(--bg-0)",
        backgroundImage: [
          "radial-gradient(70vmax 50vmax at 20% 15%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 60%)",
          "radial-gradient(60vmax 45vmax at 90% 30%, color-mix(in oklab, var(--accent) 5%, transparent), transparent 60%)",
          "radial-gradient(circle at 1px 1px, var(--line) 1px, transparent 0)",
        ].join(", "),
        backgroundSize: "auto, auto, 32px 32px",
      }}
    />
  );
}
