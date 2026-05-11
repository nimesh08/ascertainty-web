"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Tag } from "lucide-react";

import { StatusPill } from "@/components/shared/StatusPill";
import { ProjectHero } from "@/components/investor/project-hero";
import { fmtUsdc } from "@/lib/utils/format";
import {
  SectionCard,
  SectionTitle,
} from "@/app/projects/[id]/sections-part-1";

export function PoolHeroCard({
  pool,
}: {
  pool: { name: string; status: string; description: string | null };
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-line/60 bg-bg-1/50"
    >
      <ProjectHero kind="pool" />
      <div className="space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-serif text-3xl italic leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-br from-violet via-cyan to-green bg-clip-text text-transparent">
              {pool.name}
            </span>
          </h1>
          <StatusPill status={pool.status} />
        </div>
        {pool.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-fg/85 sm:text-[15px]">
            {pool.description}
          </p>
        ) : null}
      </div>
    </motion.section>
  );
}

export function UnderlyingProjectsSection({
  underlying,
}: {
  underlying: Array<{
    projectId: string;
    msmeName: string;
    sector: string;
    location: string;
    status: string;
    targetUsdc: string;
    tokensSold: string;
  }>;
}) {
  return (
    <SectionCard delay={0.15}>
      <SectionTitle label="Composition" title="Underlying projects" />
      {underlying.length === 0 ? (
        <p className="text-sm text-fg-muted">
          This pool has no underlying projects yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {underlying.map((u) => {
            const target = Number(u.targetUsdc) / 1_000_000;
            const sold = Number(u.tokensSold) / 1_000_000;
            const pct = target > 0 ? Math.min(100, (sold / target) * 100) : 0;
            return (
              <Link
                key={u.projectId}
                href={`/projects/${u.projectId}`}
                className="group block rounded-xl border border-line/60 bg-bg-2/40 p-4 transition-colors hover:border-violet/40 hover:bg-bg-2/60"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-fg">
                    {u.msmeName}
                  </h3>
                  <StatusPill status={u.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-muted">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="size-3" />
                    {u.sector.replace(/_/g, " ")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {u.location}
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">Funded</span>
                    <span className="mono-num text-fg">
                      {fmtUsdc(u.tokensSold)} / {fmtUsdc(u.targetUsdc)}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-bg-2">
                    <div
                      className="h-full bg-violet transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-violet opacity-0 transition-opacity group-hover:opacity-100">
                  View project
                  <ArrowRight className="size-3" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
