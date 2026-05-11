"use client";

export function BackgroundFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: "#07090a",
        backgroundImage: [
          "radial-gradient(60vmax 40vmax at 15% 15%, rgba(74, 222, 128, 0.16), transparent 60%)",
          "radial-gradient(55vmax 45vmax at 90% 30%, rgba(103, 232, 249, 0.10), transparent 60%)",
          "radial-gradient(50vmax 50vmax at 50% 90%, rgba(167, 139, 250, 0.08), transparent 60%)",
          "radial-gradient(circle at 1px 1px, rgba(74, 222, 128, 0.05) 1px, transparent 0)",
        ].join(", "),
        backgroundSize: "auto, auto, auto, 32px 32px",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.25] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
