"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  LineChart,
  Layers,
  Coins,
  Plus,
  Minus,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import { BlurReveal } from "@/components/landing/blur-reveal";
import { StatusPill } from "@/components/landing/status-pill";
import { CountUp } from "@/components/landing/count-up";
import { Marquee } from "@/components/landing/marquee";
import { SpotlightCard } from "@/components/landing/spotlight-card";

export interface LandingStats {
  totalFundedRaw: string;
  totalDistributedRaw: string;
  activeProjects: number;
  projectCount: number;
  poolCount: number;
}

export function LandingClient({ stats }: { stats: LandingStats }) {
  const totalFundedUsdc = Number(stats.totalFundedRaw) / 1_000_000;
  const totalDistributed = Number(stats.totalDistributedRaw) / 1_000_000;
  const bestApy = 12.4;

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <Container className="pt-16 pb-16 sm:pt-24 sm:pb-20 md:pt-32 md:pb-28">
          <StatusPill>
            Devnet · v1 live · <span className="mono-num">92</span> contract tests passing
          </StatusPill>

          <BlurReveal
            text="Finance that *compounds* MSME *savings.*"
            className="mt-6 max-w-4xl text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-6xl md:text-[4.5rem]"
          />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-6 max-w-2xl text-base text-fg-muted sm:text-lg"
          >
            Exira routes USDC into verified energy-efficiency projects for Indian
            MSMEs, mints a share-of-savings token, and distributes on-chain
            repayments — non-custodial, transparent, composable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.6 }}
            className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/projects">
                Explore projects <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/portfolio">My portfolio</Link>
            </Button>
          </motion.div>

          {/* Hero ticker — 4 cells */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <TickerCell
              label="Total funded"
              value={<CountUp value={totalFundedUsdc} decimals={2} prefix="$" />}
              sub={`${stats.activeProjects} active projects`}
              accent="green"
            />
            <TickerCell
              label="Active projects"
              value={<CountUp value={stats.activeProjects} decimals={0} />}
              sub="live on devnet"
              accent="cyan"
            />
            <TickerCell
              label="Best project APY"
              value={<CountUp value={bestApy} decimals={1} suffix="%" />}
              sub="rolling estimate"
              accent="violet"
            />
            <TickerCell
              label="Distributed 24h"
              value={<CountUp value={totalDistributed} decimals={2} prefix="$" />}
              sub="USDC to investors"
              accent="magenta"
            />
          </motion.div>
        </Container>

        {/* Marquee */}
        <div className="border-y border-line/60 bg-bg-1/40 backdrop-blur">
          <Container className="py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <p className="shrink-0 text-xs uppercase tracking-[0.2em] text-fg-muted">
                Composing capital across
              </p>
              <div className="min-w-0 flex-1">
                <Marquee />
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* STATS */}
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <BigStat label="Total projects" value={stats.projectCount} suffix="" />
          <BigStat label="Total raised" value={totalFundedUsdc} decimals={0} prefix="$" />
          <BigStat label="Best APY" value={bestApy} decimals={1} suffix="%" accent="cyan" />
          <BigStat label="Contract tests" value={92} suffix="" accent="violet" />
        </div>
      </Container>

      {/* FEATURES */}
      <Container className="py-12 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-green">Primitives</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for auditable, on-chain MSME finance
          </h2>
          <p className="mt-3 text-fg-muted">
            Every primitive is a Solana program account. Every distribution is a
            signed instruction. Every saving is measured by a licensed auditor.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard className="row-span-2 flex flex-col gap-4 p-6 lg:col-span-2">
            <div className="relative overflow-hidden rounded-lg border border-line/80 bg-bg-2/50 p-1">
              <div className="conic-border absolute inset-0 -z-10 opacity-40 blur-2xl" />
              <MiniApySvg className="h-40 w-full text-green sm:h-48" />
            </div>
            <div>
              <Badge variant="outline" className="border-green/40 text-green">
                Flagship
              </Badge>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-fg">
                Share-of-savings tokens
              </h3>
              <p className="mt-2 text-sm text-fg-muted">
                Each project mints an SPL token backed by measurable energy
                savings. Distributions accrue per-token; claims are pro-rata.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">SPL Token</Badge>
                <Badge variant="outline">PDA vault</Badge>
                <Badge variant="outline">Pro-rata claim</Badge>
              </div>
            </div>
          </SpotlightCard>

          <FeatureTile
            icon={<ShieldCheck className="size-5 text-cyan" />}
            title="MRV-verified"
            body="Baselines and verifications are attested by licensed auditors, on-chain."
          />
          <FeatureTile
            icon={<Layers className="size-5 text-violet" />}
            title="Composable pools"
            body="Diversify across a basket of underlying MSME projects with one token."
          />
          <FeatureTile
            icon={<Coins className="size-5 text-magenta" />}
            title="USDC settlement"
            body="Devnet today, mainnet next. Distributions settle in Circle USDC."
          />
          <FeatureTile
            icon={<LineChart className="size-5 text-green" />}
            title="Transparent accounting"
            body="Every buy, distribute, and claim is a signature on Solana. No off-chain ledgers."
          />
        </div>
      </Container>

      {/* HOW IT WORKS */}
      <Container className="py-16 sm:py-24">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps. Entirely on-chain.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              n: 1,
              t: "Fund a project",
              b: "Pick an MSME, invest USDC, and receive share-of-savings tokens minted to your wallet.",
            },
            {
              n: 2,
              t: "MSME saves energy",
              b: "The MSME deploys the upgrade. A licensed auditor measures real kWh and INR savings.",
            },
            {
              n: 3,
              t: "Claim distributions",
              b: "Savings repay investors proportionally. Claim anytime — accrual is per-token and atomic.",
            },
          ].map((s) => (
            <Card key={s.n} className="relative gap-2 overflow-hidden p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-0 font-serif text-[8rem] italic leading-none text-fg-faint/30"
              >
                {s.n}
              </span>
              <h3 className="relative mt-2 text-lg font-semibold text-fg">
                {s.t}
              </h3>
              <p className="relative text-sm text-fg-muted">{s.b}</p>
            </Card>
          ))}
        </div>
      </Container>

      {/* ROADMAP */}
      <Container className="py-16 sm:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-violet">Roadmap</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            The path to mainnet
          </h2>
        </div>

        <div className="relative space-y-6 border-l border-line/60 pl-6 sm:pl-10">
          {[
            { d: true, t: "V0: Devnet contracts", s: "Program deployed, 92 tests passing." },
            { d: true, t: "V0.5: Investor app", s: "Buy, claim, and pool flows live on devnet." },
            { d: false, now: true, t: "V1: MRV attestations", s: "Licensed auditors submit baselines + verifications on-chain." },
            { d: false, t: "V1.5: Pool aggregation", s: "Sweep pooled project returns into pool vaults automatically." },
            { d: false, t: "V2: Mainnet", s: "Audited program. Real USDC. Real MSME projects." },
          ].map((r, i) => (
            <div key={i} className="relative">
              <span
                aria-hidden
                className={
                  "absolute -left-[29px] sm:-left-[43px] top-1.5 grid size-3.5 place-items-center rounded-full border " +
                  (r.d
                    ? "border-green/50 bg-green"
                    : r.now
                      ? "border-green/60 bg-transparent"
                      : "border-fg-faint/50 bg-bg-1")
                }
              >
                {r.now ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/60" />
                    <span className="relative size-1.5 rounded-full bg-green" />
                  </>
                ) : null}
              </span>
              <p className="text-sm font-medium text-fg">{r.t}</p>
              <p className="mt-1 text-sm text-fg-muted">{r.s}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* FAQ */}
      <Container className="py-16 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-magenta">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Answers
          </h2>
        </div>
        <Accordion type="single" collapsible className="mx-auto max-w-3xl">
          {[
            {
              q: "Is this real USDC?",
              a: "On devnet today, using a test USDC mint. Mainnet with real USDC is in the roadmap.",
            },
            {
              q: "Who custodies my funds?",
              a: "You do. Every investment is a Solana transaction you sign. Exira's program holds vaults on PDAs; no off-chain custodian.",
            },
            {
              q: "How is yield generated?",
              a: "MSMEs use the capital to deploy verified energy upgrades. Realized savings (measured by licensed auditors) flow back as USDC distributions.",
            },
            {
              q: "What happens if a project fails?",
              a: "Your position is on-chain and non-custodial. If an MSME under-delivers, distributions reflect actual savings; there is no insurance on devnet.",
            },
            {
              q: "Can I exit before the term ends?",
              a: "Positions are claimable at any time for accrued distributions. Secondary market for tokens is on the roadmap.",
            },
          ].map((f, i) => (
            <FaqItem key={i} value={`item-${i}`} q={f.q} a={f.a} />
          ))}
        </Accordion>
      </Container>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(60vmax 40vmax at 50% 100%, rgba(74,222,128,0.22), transparent 65%)",
          }}
        />
        <Container className="py-20 text-center sm:py-28">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Stop letting MSMEs stay{" "}
            <span className="font-serif italic text-fg-muted">locked out.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-fg-muted">
            On-chain capital. Verified savings. Pro-rata returns. All from the
            wallet you already own.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/projects">
                Explore projects <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/pools">Browse pools</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

function TickerCell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  accent: "green" | "cyan" | "violet" | "magenta";
}) {
  const border =
    accent === "green"
      ? "hover:border-green/30"
      : accent === "cyan"
        ? "hover:border-cyan/30"
        : accent === "violet"
          ? "hover:border-violet/30"
          : "hover:border-magenta/30";
  return (
    <Card className={`gap-1 p-4 transition-colors ${border}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-fg-muted">
        {label}
      </p>
      <p className="text-xl font-medium text-fg sm:text-2xl">{value}</p>
      <p className="text-xs text-fg-muted">{sub}</p>
    </Card>
  );
}

function BigStat({
  label,
  value,
  decimals = 0,
  prefix,
  suffix,
  accent = "green",
}: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  accent?: "green" | "cyan" | "violet" | "magenta";
}) {
  const color =
    accent === "green"
      ? "text-green"
      : accent === "cyan"
        ? "text-cyan"
        : accent === "violet"
          ? "text-violet"
          : "text-magenta";
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-fg-muted">{label}</p>
      <p className={`text-4xl font-semibold tracking-tight sm:text-5xl ${color}`}>
        <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </p>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <SpotlightCard className="flex flex-col gap-2 p-5">
      <div className="flex size-9 items-center justify-center rounded-lg border border-line/80 bg-bg-2/60">
        {icon}
      </div>
      <h3 className="mt-1 text-base font-semibold tracking-tight text-fg">
        {title}
      </h3>
      <p className="text-sm text-fg-muted">{body}</p>
    </SpotlightCard>
  );
}

function FaqItem({ value, q, a }: { value: string; q: string; a: string }) {
  return (
    <AccordionItem value={value} className="border-line/60">
      <AccordionTrigger className="group text-base [&>svg]:hidden">
        <span className="flex-1">{q}</span>
        <span
          aria-hidden
          className="ml-3 grid size-6 shrink-0 place-items-center rounded-full border border-line/60 text-fg-muted"
        >
          <Plus className="size-3 group-data-[state=open]:hidden" />
          <Minus className="size-3 hidden group-data-[state=open]:block" />
        </span>
      </AccordionTrigger>
      <AccordionContent className="text-fg-muted">{a}</AccordionContent>
    </AccordionItem>
  );
}

function MiniApySvg({ className }: { className?: string }) {
  const pts = Array.from({ length: 32 }, (_, i) => {
    const x = (i / 31) * 100;
    const y = 50 - Math.sin(i / 3) * 14 - i * 0.7;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points={`${pts} 100,60 0,60`} fill="url(#ag)" opacity="0.4" />
    </svg>
  );
}
