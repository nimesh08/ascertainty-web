import {
  pgTable,
  pgEnum,
  text,
  uuid,
  timestamp,
  numeric,
  bigint,
  integer,
  boolean,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// enums
// ---------------------------------------------------------------------------
export const projectStatusEnum = pgEnum("project_status", [
  "pending",
  "funding",
  "active",
  "repaying",
  "completed",
  "cancelled",
]);

export const poolStatusEnum = pgEnum("pool_status", [
  "funding",
  "active",
  "distributing",
  "completed",
  "cancelled",
]);

export const mrvProjectStatusEnum = pgEnum("mrv_project_status", [
  "registered",
  "baseline_submitted",
  "verified",
  "rejected",
]);

export const underwritingStatusEnum = pgEnum("underwriting_status", [
  "pending",          // ECM created, no prediction yet
  "predicted",        // PINN inference done
  "soft_committed",   // lender signed soft commit letter
  "finalized",        // Day-30 audit complete, realized savings recorded
  "reconciled",       // ±15%/±20% pass/fail computed
]);

export const txTypeEnum = pgEnum("tx_type", [
  "init_platform",
  "create_project",
  "activate_project",
  "buy_project",
  "claim_project",
  "distribute",
  "withdraw",
  "register_mrv",
  "submit_baseline",
  "submit_verification",
  "attest",
  "add_auditor",
  "create_pool",
  "add_to_pool",
  "buy_pool",
  "distribute_pool",
  "claim_pool",
]);

// ---------------------------------------------------------------------------
// tables
// ---------------------------------------------------------------------------

export const adminWallets = pgTable("admin_wallets", {
  walletPubkey: text("wallet_pubkey").primaryKey(),
  displayName: text("display_name"),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});

export const investors = pgTable("investors", {
  privyUserId: text("privy_user_id").primaryKey(),
  walletPubkey: text("wallet_pubkey").unique(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const mrvProjects = pgTable("mrv_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  onchainPda: text("onchain_pda").unique(),
  onchainProjectId: bigint("onchain_project_id", { mode: "bigint" }).unique(),
  msmeName: text("msme_name").notNull(),
  sector: text("sector").notNull(),
  location: text("location").notNull(),
  upgradeType: text("upgrade_type").notNull(),
  status: mrvProjectStatusEnum("status").default("registered").notNull(),
  baselineSubmitted: boolean("baseline_submitted").default(false).notNull(),
  verificationCount: integer("verification_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    onchainProjectId: bigint("onchain_project_id", { mode: "bigint" }).unique(),
    onchainPda: text("onchain_pda").unique(),
    tokenMint: text("token_mint"),
    usdcVault: text("usdc_vault"),
    msmeName: text("msme_name").notNull(),
    sector: text("sector").notNull(),
    location: text("location").notNull(),
    upgradeType: text("upgrade_type").notNull(),
    targetUsdc: numeric("target_usdc", { precision: 40, scale: 0 }).default("0").notNull(),
    tokensSold: numeric("tokens_sold", { precision: 40, scale: 0 }).default("0").notNull(),
    totalDistributed: numeric("total_distributed", { precision: 40, scale: 0 }).default("0").notNull(),
    cumulativePerToken: numeric("cumulative_per_token", { precision: 40, scale: 0 }).default("0").notNull(),
    termMonths: integer("term_months").notNull(),
    status: projectStatusEnum("status").default("pending").notNull(),
    mrvProjectId: uuid("mrv_project_id").references(() => mrvProjects.id),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    // --- Admin-editable content (NULLABLE — safe for existing rows) ---------
    description: text("description"),
    aboutProject: text("about_project"),
    highlights: jsonb("highlights").$type<
      Array<{ title: string; detail: string; icon?: string }>
    >(),
    managementText: text("management_text"),
    financialsText: text("financials_text"),
    documents: jsonb("documents").$type<Array<{ name: string; url: string }>>(),
    trustScore: integer("trust_score"),
    expectedApyBps: integer("expected_apy_bps"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
  },
  (t) => ({
    onchainIdx: index("projects_onchain_project_id_idx").on(t.onchainProjectId),
  })
);

export const pools = pgTable("pools", {
  id: uuid("id").defaultRandom().primaryKey(),
  onchainPoolId: bigint("onchain_pool_id", { mode: "bigint" }).unique(),
  onchainPda: text("onchain_pda").unique(),
  poolTokenMint: text("pool_token_mint"),
  usdcVault: text("usdc_vault"),
  name: text("name").notNull(),
  description: text("description"),
  targetUsdc: numeric("target_usdc", { precision: 40, scale: 0 }).default("0").notNull(),
  tokensSold: numeric("tokens_sold", { precision: 40, scale: 0 }).default("0").notNull(),
  totalDistributed: numeric("total_distributed", { precision: 40, scale: 0 }).default("0").notNull(),
  cumulativePerToken: numeric("cumulative_per_token", { precision: 40, scale: 0 }).default("0").notNull(),
  status: poolStatusEnum("status").default("funding").notNull(),
  // --- Admin-editable content (NULLABLE) ------------------------------------
  aboutPool: text("about_pool"),
  highlights: jsonb("highlights").$type<
    Array<{ title: string; detail: string; icon?: string }>
  >(),
  managementText: text("management_text"),
  financialsText: text("financials_text"),
  documents: jsonb("documents").$type<Array<{ name: string; url: string }>>(),
  trustScore: integer("trust_score"),
  expectedApyBps: integer("expected_apy_bps"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

export const poolProjects = pgTable(
  "pool_projects",
  {
    poolId: uuid("pool_id")
      .notNull()
      .references(() => pools.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.poolId, t.projectId] }),
  })
);

export const investorPositions = pgTable(
  "investor_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletPubkey: text("wallet_pubkey").notNull(),
    projectId: uuid("project_id").references(() => projects.id),
    poolId: uuid("pool_id").references(() => pools.id),
    tokenAmount: numeric("token_amount", { precision: 40, scale: 0 }).default("0").notNull(),
    lastCumulativePerToken: numeric("last_cumulative_per_token", {
      precision: 40,
      scale: 0,
    })
      .default("0")
      .notNull(),
    claimedTotal: numeric("claimed_total", { precision: 40, scale: 0 }).default("0").notNull(),
    onchainPda: text("onchain_pda"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
  },
  (t) => ({
    exactlyOneTarget: check(
      "investor_positions_exactly_one_target",
      sql`(("project_id" IS NOT NULL)::int + ("pool_id" IS NOT NULL)::int) = 1`
    ),
    uniqueWalletProject: uniqueIndex("investor_positions_wallet_project_uq")
      .on(t.walletPubkey, t.projectId)
      .where(sql`${t.projectId} IS NOT NULL`),
    uniqueWalletPool: uniqueIndex("investor_positions_wallet_pool_uq")
      .on(t.walletPubkey, t.poolId)
      .where(sql`${t.poolId} IS NOT NULL`),
  })
);

export const mrvBaselines = pgTable("mrv_baselines", {
  id: uuid("id").defaultRandom().primaryKey(),
  mrvProjectId: uuid("mrv_project_id")
    .notNull()
    .references(() => mrvProjects.id, { onDelete: "cascade" }),
  auditorWallet: text("auditor_wallet").notNull(),
  energyKwhPerYear: bigint("energy_kwh_per_year", { mode: "bigint" }).notNull(),
  fuelType: text("fuel_type").notNull(),
  reportHash: text("report_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mrvVerifications = pgTable("mrv_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  mrvProjectId: uuid("mrv_project_id")
    .notNull()
    .references(() => mrvProjects.id, { onDelete: "cascade" }),
  auditorWallet: text("auditor_wallet").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  attested: boolean("attested").default(false).notNull(),
  reportHash: text("report_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditors = pgTable("auditors", {
  walletPubkey: text("wallet_pubkey").primaryKey(),
  name: text("name").notNull(),
  certification: text("certification").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
  onchainRegistered: boolean("onchain_registered").default(false).notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    txSig: text("tx_sig").notNull().unique(),
    txType: txTypeEnum("tx_type").notNull(),
    walletPubkey: text("wallet_pubkey").notNull(),
    projectId: uuid("project_id").references(() => projects.id),
    poolId: uuid("pool_id").references(() => pools.id),
    amountUsdc: numeric("amount_usdc", { precision: 40, scale: 0 }),
    tokenAmount: numeric("token_amount", { precision: 40, scale: 0 }),
    blockTime: timestamp("block_time", { withTimezone: true }),
    slot: bigint("slot", { mode: "bigint" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    walletIdx: index("transactions_wallet_idx").on(t.walletPubkey),
    projectIdx: index("transactions_project_idx").on(t.projectId),
    poolIdx: index("transactions_pool_idx").on(t.poolId),
    blockTimeIdx: index("transactions_block_time_desc_idx").on(t.blockTime.desc()),
  })
);

// ---------------------------------------------------------------------------
// underwriting / PINN predictions (v0.1)
// ---------------------------------------------------------------------------

export const underwritingResults = pgTable(
  "underwriting_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // FK targets (both nullable: an auditor may start before on-chain project exists)
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    mrvProjectId: uuid("mrv_project_id").references(() => mrvProjects.id, { onDelete: "cascade" }),
    // Auditor-supplied identifiers
    dealId: text("deal_id").notNull(),         // human-readable, used for /lender/[deal_id] URL
    ecmId: text("ecm_id").notNull(),           // auditor-supplied ECM ordinal/name within the deal
    equipmentType: text("equipment_type").notNull(),
    sector: text("sector").notNull(),
    description: text("description"),
    // Raw audit inputs (the PredictRequest payload)
    auditInputsJson: jsonb("audit_inputs_json").notNull(),
    // PINN prediction (the PredictResponse payload, mirrored to typed columns for query speed)
    predictionJson: jsonb("prediction_json"),
    modelUsed: text("model_used"),
    sigmaScaleApplied: numeric("sigma_scale_applied", { precision: 10, scale: 4 }),
    pinnSavingsKwh: numeric("pinn_savings_kwh", { precision: 20, scale: 2 }),
    pinnP5LowerKwh: numeric("pinn_p5_lower_kwh", { precision: 20, scale: 2 }),
    pinnP95UpperKwh: numeric("pinn_p95_upper_kwh", { precision: 20, scale: 2 }),
    pinnSigmaKwh: numeric("pinn_sigma_kwh", { precision: 20, scale: 2 }),
    confidenceGrade: text("confidence_grade"),  // A / B / C
    // Cost / loan
    baselineKwhPerYear: numeric("baseline_kwh_per_year", { precision: 20, scale: 2 }).notNull(),
    investmentInr: numeric("investment_inr", { precision: 20, scale: 2 }),
    electricityRateInrKwh: numeric("electricity_rate_inr_kwh", { precision: 10, scale: 2 }).default("8.00"),
    annualSavingsInr: numeric("annual_savings_inr", { precision: 20, scale: 2 }),
    paybackMonths: numeric("payback_months", { precision: 10, scale: 2 }),
    p5PaybackMonths: numeric("p5_payback_months", { precision: 10, scale: 2 }),
    recommendedLoanInr: numeric("recommended_loan_inr", { precision: 20, scale: 2 }),
    // Physics-only fallback (when PINN flags low confidence)
    physicsSavingsKwh: numeric("physics_savings_kwh", { precision: 20, scale: 2 }),
    // Status
    status: underwritingStatusEnum("status").default("pending").notNull(),
    // Reconciliation (filled at Day-30)
    realizedSavingsKwh: numeric("realized_savings_kwh", { precision: 20, scale: 2 }),
    realizedAt: timestamp("realized_at", { withTimezone: true }),
    pointEstimateDeltaPct: numeric("point_estimate_delta_pct", { precision: 10, scale: 2 }),
    p5ViolatedFlag: boolean("p5_violated_flag"),
    reconciliationPasses: boolean("reconciliation_passes"),
    // Audit trail
    auditorWallet: text("auditor_wallet"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealIdx: index("underwriting_deal_idx").on(t.dealId),
    projectIdx: index("underwriting_project_idx").on(t.projectId),
    statusIdx: index("underwriting_status_idx").on(t.status),
    dealEcmUq: uniqueIndex("underwriting_deal_ecm_uq").on(t.dealId, t.ecmId),
  })
);

export const underwritingSnapshots = pgTable(
  "underwriting_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    underwritingResultId: uuid("underwriting_result_id")
      .notNull()
      .references(() => underwritingResults.id, { onDelete: "cascade" }),
    snapshotDay: integer("snapshot_day"),                 // Day in 1..30 of the live audit; null if auto/unknown
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).defaultNow().notNull(),
    inputsJson: jsonb("inputs_json").notNull(),
    predictionJson: jsonb("prediction_json").notNull(),
    modelUsed: text("model_used"),
    pinnSavingsKwh: numeric("pinn_savings_kwh", { precision: 20, scale: 2 }),
    pinnP5LowerKwh: numeric("pinn_p5_lower_kwh", { precision: 20, scale: 2 }),
    pinnP95UpperKwh: numeric("pinn_p95_upper_kwh", { precision: 20, scale: 2 }),
    pinnSigmaKwh: numeric("pinn_sigma_kwh", { precision: 20, scale: 2 }),
    confidenceGrade: text("confidence_grade"),
    label: text("label"),                                  // optional human-readable label (e.g. "Day 5 — leakage measured")
  },
  (t) => ({
    underwritingIdx: index("snapshot_underwriting_idx").on(t.underwritingResultId),
    dayIdx: index("snapshot_day_idx").on(t.underwritingResultId, t.snapshotDay),
  })
);

export const softCommitments = pgTable(
  "soft_commitments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    underwritingResultId: uuid("underwriting_result_id")
      .notNull()
      .references(() => underwritingResults.id, { onDelete: "cascade" }),
    lenderName: text("lender_name").notNull(),
    lenderWallet: text("lender_wallet"),         // optional — stand-in lenders may not have wallets
    lenderEmail: text("lender_email"),
    loanAmountInr: numeric("loan_amount_inr", { precision: 20, scale: 2 }).notNull(),
    interestRateBps: integer("interest_rate_bps"),
    tenureMonths: integer("tenure_months"),
    p5FloorKwh: numeric("p5_floor_kwh", { precision: 20, scale: 2 }).notNull(),
    letterPdfUrl: text("letter_pdf_url"),
    signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
    notes: text("notes"),
  },
  (t) => ({
    underwritingIdx: index("soft_commit_underwriting_idx").on(t.underwritingResultId),
  })
);

// ---------------------------------------------------------------------------
// relations
// ---------------------------------------------------------------------------

export const mrvProjectsRelations = relations(mrvProjects, ({ many, one }) => ({
  baselines: many(mrvBaselines),
  verifications: many(mrvVerifications),
  project: one(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  mrvProject: one(mrvProjects, {
    fields: [projects.mrvProjectId],
    references: [mrvProjects.id],
  }),
  poolLinks: many(poolProjects),
  positions: many(investorPositions),
  transactions: many(transactions),
}));

export const poolsRelations = relations(pools, ({ many }) => ({
  poolProjects: many(poolProjects),
  positions: many(investorPositions),
  transactions: many(transactions),
}));

export const poolProjectsRelations = relations(poolProjects, ({ one }) => ({
  pool: one(pools, { fields: [poolProjects.poolId], references: [pools.id] }),
  project: one(projects, {
    fields: [poolProjects.projectId],
    references: [projects.id],
  }),
}));

export const investorPositionsRelations = relations(investorPositions, ({ one }) => ({
  project: one(projects, {
    fields: [investorPositions.projectId],
    references: [projects.id],
  }),
  pool: one(pools, {
    fields: [investorPositions.poolId],
    references: [pools.id],
  }),
}));

export const mrvBaselinesRelations = relations(mrvBaselines, ({ one }) => ({
  mrvProject: one(mrvProjects, {
    fields: [mrvBaselines.mrvProjectId],
    references: [mrvProjects.id],
  }),
}));

export const mrvVerificationsRelations = relations(mrvVerifications, ({ one }) => ({
  mrvProject: one(mrvProjects, {
    fields: [mrvVerifications.mrvProjectId],
    references: [mrvProjects.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  pool: one(pools, {
    fields: [transactions.poolId],
    references: [pools.id],
  }),
}));

export const underwritingResultsRelations = relations(underwritingResults, ({ one, many }) => ({
  project: one(projects, {
    fields: [underwritingResults.projectId],
    references: [projects.id],
  }),
  mrvProject: one(mrvProjects, {
    fields: [underwritingResults.mrvProjectId],
    references: [mrvProjects.id],
  }),
  softCommitments: many(softCommitments),
  snapshots: many(underwritingSnapshots),
}));

export const underwritingSnapshotsRelations = relations(underwritingSnapshots, ({ one }) => ({
  underwritingResult: one(underwritingResults, {
    fields: [underwritingSnapshots.underwritingResultId],
    references: [underwritingResults.id],
  }),
}));

export const softCommitmentsRelations = relations(softCommitments, ({ one }) => ({
  underwritingResult: one(underwritingResults, {
    fields: [softCommitments.underwritingResultId],
    references: [underwritingResults.id],
  }),
}));

// ---------------------------------------------------------------------------
// inferred types
// ---------------------------------------------------------------------------

export type AdminWallet = typeof adminWallets.$inferSelect;
export type NewAdminWallet = typeof adminWallets.$inferInsert;
export type Investor = typeof investors.$inferSelect;
export type NewInvestor = typeof investors.$inferInsert;
export type MrvProject = typeof mrvProjects.$inferSelect;
export type NewMrvProject = typeof mrvProjects.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Pool = typeof pools.$inferSelect;
export type NewPool = typeof pools.$inferInsert;
export type PoolProject = typeof poolProjects.$inferSelect;
export type NewPoolProject = typeof poolProjects.$inferInsert;
export type InvestorPosition = typeof investorPositions.$inferSelect;
export type NewInvestorPosition = typeof investorPositions.$inferInsert;
export type MrvBaseline = typeof mrvBaselines.$inferSelect;
export type NewMrvBaseline = typeof mrvBaselines.$inferInsert;
export type MrvVerification = typeof mrvVerifications.$inferSelect;
export type NewMrvVerification = typeof mrvVerifications.$inferInsert;
export type Auditor = typeof auditors.$inferSelect;
export type NewAuditor = typeof auditors.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type UnderwritingResult = typeof underwritingResults.$inferSelect;
export type NewUnderwritingResult = typeof underwritingResults.$inferInsert;
export type SoftCommitment = typeof softCommitments.$inferSelect;
export type NewSoftCommitment = typeof softCommitments.$inferInsert;
export type UnderwritingSnapshot = typeof underwritingSnapshots.$inferSelect;
export type NewUnderwritingSnapshot = typeof underwritingSnapshots.$inferInsert;
