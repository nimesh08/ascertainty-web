type Name = "vault" | "id" | "brain" | "meter" | "wave" | "rail";

export function Glyph({ name }: { name: Name }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.2,
    style: { color: "var(--accent)" },
  };
  switch (name) {
    case "vault":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="14" height="11" />
          <circle cx="10" cy="10.5" r="2.5" />
          <path d="M10 7v1m0 5v1m3-3.5h1m-8 0h1" />
        </svg>
      );
    case "id":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="14" height="12" />
          <circle cx="7" cy="9" r="1.5" />
          <path d="M4.5 14c.5-2 1.5-2.5 2.5-2.5s2 .5 2.5 2.5M11 8h4M11 11h3" />
        </svg>
      );
    case "brain":
      return (
        <svg {...props}>
          <path d="M7 5c-2 0-3 1-3 3s1 2 1 3-1 1-1 3 1 3 3 3M13 5c2 0 3 1 3 3s-1 2-1 3 1 1 1 3-1 3-3 3M7 5c1.5-1.5 4.5-1.5 6 0M7 17c1.5 1.5 4.5 1.5 6 0M10 5v12" />
        </svg>
      );
    case "meter":
      return (
        <svg {...props}>
          <circle cx="10" cy="10" r="6.5" />
          <path d="M10 10l3-3M5 10h1m8 0h1M10 4v1m0 10v1" />
        </svg>
      );
    case "wave":
      return (
        <svg {...props}>
          <path d="M3 12c2-4 4-4 6 0s4 4 6 0M3 8h14M3 16h14" />
        </svg>
      );
    case "rail":
      return (
        <svg {...props}>
          <path d="M3 6h14M3 10h14M3 14h14M6 6v8M10 6v8M14 6v8" />
        </svg>
      );
  }
}
