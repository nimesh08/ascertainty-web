import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { CoinMark } from "@/components/layout/coin-mark";

export const metadata: Metadata = {
  title: "Brand kit · Ascertainty",
  description:
    "Forest brand kit — logo, color palette, typography. Open for press, partners, and integrations.",
};

/**
 * /brand — public brand kit.
 *
 * v0.3 minimum-viable version covering the four spec sections that matter:
 *  §01 Logos & lockups (coin variants + downloads)
 *  §02 Forest greens (5-swatch palette)
 *  §03 Neutral tones (5-swatch palette)
 *  §04 Typography (current curated stack — Poppins + Instrument Serif)
 *
 * Full polished version (per `reference/Brand Kit.html` in the design handoff)
 * deferred to a later session.
 */
export default function BrandPage() {
  return (
    <Container className="py-12 sm:py-20">
      {/* HERO */}
      <header className="mb-16 max-w-3xl">
        <span className="block text-[11px] uppercase tracking-[0.22em] text-fg-muted">
          § Brand kit
        </span>
        <h1
          className="mt-4 font-serif text-5xl italic leading-[1.05] tracking-tight text-fg sm:text-6xl"
          style={{ color: "var(--fg)" }}
        >
          The visual identity of <span style={{ color: "var(--accent)" }}>Ascertainty</span>.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-fg/80">
          Three nested arcs ascending to a peak, inscribed in a forest disc.
          The mark builds in sequence — a quiet animation that signals the
          calibrated, time-bounded nature of every loan we underwrite. Below:
          all the assets, colors, and type you need to talk about us.
        </p>
      </header>

      {/* §01 LOGOS & LOCKUPS */}
      <section className="mb-20 border-t border-line/60 pt-14">
        <SectionHead idx="01" title="Logos & lockups" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <AssetCard
            label="Coin · Ink"
            sublabel="Primary mark on light grounds"
            href="/brand/coin-ink.svg"
            tone="light"
          >
            <CoinMark size={120} variant="ink" />
          </AssetCard>
          <AssetCard
            label="Coin · White"
            sublabel="Inverse coin for dark grounds"
            href="/brand/coin-white.svg"
            tone="dark"
          >
            <CoinMark size={120} variant="white" />
          </AssetCard>
          <AssetCard
            label="Coin · Saturated"
            sublabel="Brand-led surfaces"
            href="/brand/coin-mark.svg"
            tone="light"
          >
            <CoinMark size={120} variant="saturated" />
          </AssetCard>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <DownloadLink href="/brand/mark.svg" label="Bare glyph (currentColor)" />
          <DownloadLink href="/brand/mark-green.svg" label="Bare glyph (green)" />
          <DownloadLink href="/brand/mark-animated.svg" label="Animated mark" />
          <DownloadLink href="/brand/mark-with-wordmark.svg" label="Mark + wordmark lockup" />
        </div>
      </section>

      {/* §02 FOREST GREENS */}
      <section className="mb-20 border-t border-line/60 pt-14">
        <SectionHead idx="02" title="Forest greens" />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Swatch name="Pale sage" hex="#e8f1ec" />
          <Swatch name="Lichen" hex="#b8d6c5" />
          <Swatch name="Verdigris" hex="#5fa67f" badge="accent" />
          <Swatch name="Pine" hex="#3a7058" />
          <Swatch name="Vault" hex="#1c3429" />
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Verdigris (<code className="font-mono text-fg">#5fa67f</code>) is the
          brand mark and the primary interactive accent. Pine darkens it for
          hover/pressed states. Vault is for deep accent surfaces.
        </p>
      </section>

      {/* §03 NEUTRAL TONES */}
      <section className="mb-20 border-t border-line/60 pt-14">
        <SectionHead idx="03" title="Neutral tones" />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Swatch name="Page" hex="#ffffff" />
          <Swatch name="Frost" hex="#fafafa" />
          <Swatch name="Fog" hex="#f5f5f5" />
          <Swatch name="Slate" hex="#e8e8e8" />
          <Swatch name="Ink" hex="#162421" dark />
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Ink (<code className="font-mono text-fg">#162421</code>) is warm
          forest dark — body text, dark surfaces, footer ground. Not pitch
          black. The palette deliberately omits cream.
        </p>
      </section>

      {/* §04 TYPOGRAPHY */}
      <section className="mb-20 border-t border-line/60 pt-14">
        <SectionHead idx="04" title="Typography" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-line/60 bg-bg-1/50 p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-fg-muted">
              Serif · Display
            </p>
            <p className="mt-4 font-serif text-5xl italic leading-[1.05] tracking-tight text-fg">
              Calibrated underwriting.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-fg-muted">
              Instrument Serif · 400 italic
            </p>
          </div>
          <div className="rounded-xl border border-line/60 bg-bg-1/50 p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-fg-muted">
              Sans · Body & system
            </p>
            <p className="mt-4 text-2xl leading-snug text-fg">
              On-chain MSME climate finance — settled to the kilowatt-hour.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg/80">
              The quick brown fox jumps over the lazy dog. 0123456789
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-fg-muted">
              Poppins · 300 / 400 / 500 / 600 · Geist Mono for numerics
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t border-line/60 pt-8 text-sm text-fg-muted">
        Need something not listed here?{" "}
        <Link href="/" className="text-accent hover:underline">
          Email Yuxin via the contact form on the home page
        </Link>
        .
      </footer>
    </Container>
  );
}

function SectionHead({ idx, title }: { idx: string; title: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4">
      <h2 className="font-serif text-3xl italic leading-tight tracking-tight text-fg sm:text-4xl">
        // {title}
      </h2>
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted">
        § {idx}
      </span>
    </div>
  );
}

function AssetCard({
  label,
  sublabel,
  href,
  tone,
  children,
}: {
  label: string;
  sublabel: string;
  href: string;
  tone: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line/60">
      <div
        className="flex h-44 items-center justify-center"
        style={{
          background: tone === "dark" ? "var(--fg)" : "var(--bg-1)",
        }}
      >
        {children}
      </div>
      <div className="space-y-2 border-t border-line/60 bg-bg-0 px-5 py-4">
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="text-xs text-fg-muted">{sublabel}</p>
        <a
          href={href}
          download
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          Download SVG ↓
        </a>
      </div>
    </div>
  );
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="block rounded-md border border-line/60 bg-bg-1/40 px-3 py-2 text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
    >
      <span className="block text-fg">{label}</span>
      <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-widest">
        {href.split("/").pop()}
      </span>
    </a>
  );
}

function Swatch({
  name,
  hex,
  dark,
  badge,
}: {
  name: string;
  hex: string;
  dark?: boolean;
  badge?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line/60">
      <div
        className="relative h-28"
        style={{
          background: hex,
          color: dark ? "rgba(255,255,255,0.6)" : "rgba(22,36,33,0.5)",
        }}
      >
        {badge ? (
          <span className="absolute right-3 top-3 rounded-full border border-current bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="space-y-1 border-t border-line/60 bg-bg-0 px-4 py-3">
        <p className="font-serif text-base italic text-fg">{name}</p>
        <p className="font-mono text-xs text-fg-muted">{hex}</p>
      </div>
    </div>
  );
}
