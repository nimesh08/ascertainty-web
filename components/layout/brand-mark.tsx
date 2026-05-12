interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 36, className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 240 240"
      aria-hidden="true"
      style={{ color: "var(--fg)", display: "inline-block" }}
    >
      <defs>
        <polygon
          id="bm-hex"
          points="0,-28 24.25,-14 24.25,14 0,28 -24.25,14 -24.25,-14"
        />
      </defs>
      <g fill="none" stroke="currentColor" strokeOpacity="0.36" strokeWidth="2">
        <use href="#bm-hex" x="120" y="63.5" />
        <use href="#bm-hex" x="168.5" y="91.75" />
        <use href="#bm-hex" x="168.5" y="148.25" />
        <use href="#bm-hex" x="120" y="176.5" />
        <use href="#bm-hex" x="71.5" y="148.25" />
        <use href="#bm-hex" x="71.5" y="91.75" />
      </g>
      <use
        href="#bm-hex"
        x="120"
        y="120"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
      />
      <g
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="square"
        fill="none"
      >
        <line x1="105" y1="138" x2="120" y2="104" />
        <line x1="120" y1="104" x2="135" y2="138" />
        <line x1="111" y1="125" x2="129" y2="125" />
      </g>
    </svg>
  );
}
