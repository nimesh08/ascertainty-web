"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Tag,
  Shield,
  ShieldCheck,
  TrendingUp,
  BadgeCheck,
  Leaf,
  Zap,
} from "lucide-react";

import { StatusPill } from "@/components/shared/StatusPill";
import { ProjectHero } from "@/components/investor/project-hero";

/** Small util: pick a lucide icon by string name. */
export function iconFromName(name?: string): React.ReactNode {
  switch (name) {
    case "shield-check":
      return <ShieldCheck className="size-5" />;
    case "shield":
      return <Shield className="size-5" />;
    case "trending-up":
      return <TrendingUp className="size-5" />;
    case "badge-check":
      return <BadgeCheck className="size-5" />;
    case "leaf":
      return <Leaf className="size-5" />;
    case "zap":
      return <Zap className="size-5" />;
    default:
      return <BadgeCheck className="size-5" />;
  }
}

/** Wrapper that applies Helix card styling + a subtle fade-in on view. */
export function SectionCard({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "rounded-2xl border border-line/60 bg-bg-1/50 p-6 sm:p-8",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </motion.section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
      {children}
    </p>
  );
}

export function SectionTitle({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <div className="mb-5 space-y-1.5">
      <SectionLabel>{label}</SectionLabel>
      <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

export function ProseText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "space-y-4 text-[15px] leading-relaxed text-fg/85",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Split a string on blank lines into separate <p> blocks. */
export function ParagraphedText({ text }: { text: string }) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <ProseText>
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </ProseText>
  );
}

/**
 * Hero card: full-bleed ProjectHero band on top, title + chips below.
 */
export function HeroCard({
  project,
}: {
  project: {
    msmeName: string;
    sector: string;
    location: string;
    status: string;
    termMonths: number;
  };
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-line/60 bg-bg-1/50"
    >
      <ProjectHero kind="project" />
      <div className="space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-br from-green via-accent to-accent bg-clip-text text-transparent">
              {project.msmeName}
            </span>
          </h1>
          <StatusPill status={project.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-bg-2/40 px-2.5 py-1">
            <Tag className="size-3.5" />
            {project.sector.replace(/_/g, " ")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-bg-2/40 px-2.5 py-1">
            <MapPin className="size-3.5" />
            {project.location}
          </span>
          <span className="mono-num inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-bg-2/40 px-2.5 py-1">
            {project.termMonths} mo term
          </span>
        </div>
      </div>
    </motion.section>
  );
}

export function AboutSection({ text }: { text: string | null }) {
  if (!text || text.trim() === "") return null;
  return (
    <SectionCard delay={0.05}>
      <SectionTitle label="Overview" title="About the project" />
      <ParagraphedText text={text} />
    </SectionCard>
  );
}

export function HighlightsSection({
  highlights,
}: {
  highlights: Array<{ title: string; detail: string; icon?: string }>;
}) {
  if (!highlights || highlights.length === 0) return null;
  return (
    <SectionCard delay={0.1}>
      <SectionTitle label="What matters" title="Key highlights" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {highlights.map((h, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-line/60 bg-bg-2/40 p-4"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-green/10 text-green">
              {iconFromName(h.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold tracking-tight text-fg">
                {h.title}
              </h3>
              <p className="mt-0.5 text-sm leading-relaxed text-fg/75">
                {h.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function UpgradesSection({
  upgradeType,
  description,
}: {
  upgradeType: string;
  description: string | null;
}) {
  const shown = (description ?? "").trim();
  return (
    <SectionCard delay={0.15}>
      <SectionTitle label="Deployment" title="Upgrades & equipment" />
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green/30 bg-green/10 px-3 py-1.5 text-sm text-green">
        <Zap className="size-3.5" />
        {upgradeType.replace(/_/g, " ")}
      </div>
      {shown ? <ParagraphedText text={shown} /> : null}
    </SectionCard>
  );
}

export function ManagementSection({ text }: { text: string | null }) {
  if (!text || text.trim() === "") return null;
  return (
    <SectionCard delay={0.2}>
      <SectionTitle label="Operations" title="Project management" />
      <ProseText>
        <p>{text}</p>
      </ProseText>
    </SectionCard>
  );
}
