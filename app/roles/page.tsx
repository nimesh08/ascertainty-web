import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  HardHat,
  Banknote,
  Building2,
  Scale,
  Database,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roles & access · Ascertainty",
  description:
    "Multi-role permissioning is designed at the platform layer. Founder is live today; auditor, lender, borrower, regulator, and data-officer roles light up as the audit pipeline and vault deployment come online.",
};

interface Role {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  scope: string;
  capabilities: string[];
  status: "active" | "coming_soon";
}

const ROLES: Role[] = [
  {
    key: "founder",
    name: "Founder / Internal ops",
    icon: ShieldCheck,
    scope: "Everything across the platform",
    capabilities: [
      "Manage all deals, pools, and projects",
      "Override prediction flags and confidence grades",
      "Configure platform-wide settings, roles, and partner integrations",
    ],
    status: "active",
  },
  {
    key: "auditor",
    name: "Auditor",
    icon: HardHat,
    scope: "Only deals assigned to them",
    capabilities: [
      "Submit measurements as the audit progresses (Day 1 → Day 30)",
      "Update audit progress, attach reports and instrument logs",
      "Sign final audit report at Day 30 reconciliation",
    ],
    status: "coming_soon",
  },
  {
    key: "lender",
    name: "Lender",
    icon: Banknote,
    scope: "Only deals they previewed or signed",
    capabilities: [
      "Browse soft-commitment-ready deals (P5 floor + recommended loan)",
      "Sign soft-commitment letters (non-binding, validates demand)",
      "Commit USDC to vault senior tranche at Phase 2 vault launch",
    ],
    status: "coming_soon",
  },
  {
    key: "borrower",
    name: "Borrower (MSME)",
    icon: Building2,
    scope: "Only their own deal",
    capabilities: [
      "View loan status, payment schedule, and realized savings",
      "Acknowledge audit data shared with prospective lenders",
      "Receive payment receipts and post-install M&V telemetry",
    ],
    status: "coming_soon",
  },
  {
    key: "regulator",
    name: "Regulator / External auditor",
    icon: Scale,
    scope: "Reconciliation reports and audit trail",
    capabilities: [
      "Read-only access to versioned predictions and Day-30 reconciliations",
      "Pull compliance reports for BEE / SIDBI / 4E / ADEETIE eligibility",
      "Verify that realized savings track soft-commitment P5 bounds",
    ],
    status: "coming_soon",
  },
  {
    key: "data_officer",
    name: "Data officer",
    icon: Database,
    scope: "Anonymized dataset access",
    capabilities: [
      "Pull aggregate metrics for research and Colab notebooks",
      "Export anonymized prediction-vs-realized datasets",
      "Manage model registry, retraining cadence, and per-region calibration",
    ],
    status: "coming_soon",
  },
];

export default function RolesPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="space-y-8">
        <PageHeader
          kicker="Platform"
          title="Roles & access"
          description="Multi-role permissioning is designed at the platform layer. The wedge release surfaces only the Founder role; the remaining roles ship as the audit pipeline (Phase 1 field test) and vault deployment (Phase 2) come online."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const active = role.status === "active";
            return (
              <Card
                key={role.key}
                className={
                  active
                    ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                    : "opacity-90"
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-fg-muted" />
                      <CardTitle className="text-base">{role.name}</CardTitle>
                    </div>
                    {active ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-accent/40 bg-accent/10 text-[10px] text-accent"
                      >
                        Coming soon
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-fg-muted">
                      Scope
                    </div>
                    <div className="text-sm">{role.scope}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-fg-muted">
                      Capabilities
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-fg/90">
                      {role.capabilities.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Implementation notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-fg/90">
            <p>
              Today, gating is via two Drizzle tables:{" "}
              <code className="rounded bg-bg-2/60 px-1 text-xs">admin_wallets</code>{" "}
              (founder/internal ops) and{" "}
              <code className="rounded bg-bg-2/60 px-1 text-xs">auditors</code>{" "}
              (one row per certified auditor wallet, with{" "}
              <code className="rounded bg-bg-2/60 px-1 text-xs">is_active</code>{" "}
              flag).
            </p>
            <p className="text-fg-muted">
              A unified <code className="rounded bg-bg-2/60 px-1 text-xs">users</code>{" "}
              table with a role enum and scoped per-deal permissions is queued for
              the next iteration. Lender and borrower portal access lights up when
              the first vault launches.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
