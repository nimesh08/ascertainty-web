CREATE TYPE "public"."mrv_project_status" AS ENUM('registered', 'baseline_submitted', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."pool_status" AS ENUM('funding', 'active', 'distributing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('pending', 'funding', 'active', 'repaying', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tx_type" AS ENUM('init_platform', 'create_project', 'activate_project', 'buy_project', 'claim_project', 'distribute', 'withdraw', 'register_mrv', 'submit_baseline', 'submit_verification', 'attest', 'add_auditor', 'create_pool', 'add_to_pool', 'buy_pool', 'distribute_pool', 'claim_pool');--> statement-breakpoint
CREATE TYPE "public"."underwriting_status" AS ENUM('pending', 'predicted', 'soft_committed', 'finalized', 'reconciled');--> statement-breakpoint
CREATE TABLE "admin_wallets" (
	"wallet_pubkey" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditors" (
	"wallet_pubkey" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"certification" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"onchain_registered" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_pubkey" text NOT NULL,
	"project_id" uuid,
	"pool_id" uuid,
	"token_amount" numeric(40, 0) DEFAULT '0' NOT NULL,
	"last_cumulative_per_token" numeric(40, 0) DEFAULT '0' NOT NULL,
	"claimed_total" numeric(40, 0) DEFAULT '0' NOT NULL,
	"onchain_pda" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone,
	CONSTRAINT "investor_positions_exactly_one_target" CHECK ((("project_id" IS NOT NULL)::int + ("pool_id" IS NOT NULL)::int) = 1)
);
--> statement-breakpoint
CREATE TABLE "investors" (
	"privy_user_id" text PRIMARY KEY NOT NULL,
	"wallet_pubkey" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "investors_wallet_pubkey_unique" UNIQUE("wallet_pubkey")
);
--> statement-breakpoint
CREATE TABLE "mrv_baselines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mrv_project_id" uuid NOT NULL,
	"auditor_wallet" text NOT NULL,
	"energy_kwh_per_year" bigint NOT NULL,
	"fuel_type" text NOT NULL,
	"report_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrv_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onchain_pda" text,
	"onchain_project_id" bigint,
	"msme_name" text NOT NULL,
	"sector" text NOT NULL,
	"location" text NOT NULL,
	"upgrade_type" text NOT NULL,
	"status" "mrv_project_status" DEFAULT 'registered' NOT NULL,
	"baseline_submitted" boolean DEFAULT false NOT NULL,
	"verification_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone,
	CONSTRAINT "mrv_projects_onchain_pda_unique" UNIQUE("onchain_pda"),
	CONSTRAINT "mrv_projects_onchain_project_id_unique" UNIQUE("onchain_project_id")
);
--> statement-breakpoint
CREATE TABLE "mrv_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mrv_project_id" uuid NOT NULL,
	"auditor_wallet" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"attested" boolean DEFAULT false NOT NULL,
	"report_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_projects" (
	"pool_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_projects_pool_id_project_id_pk" PRIMARY KEY("pool_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onchain_pool_id" bigint,
	"onchain_pda" text,
	"pool_token_mint" text,
	"usdc_vault" text,
	"name" text NOT NULL,
	"description" text,
	"target_usdc" numeric(40, 0) DEFAULT '0' NOT NULL,
	"tokens_sold" numeric(40, 0) DEFAULT '0' NOT NULL,
	"total_distributed" numeric(40, 0) DEFAULT '0' NOT NULL,
	"cumulative_per_token" numeric(40, 0) DEFAULT '0' NOT NULL,
	"status" "pool_status" DEFAULT 'funding' NOT NULL,
	"about_pool" text,
	"highlights" jsonb,
	"management_text" text,
	"financials_text" text,
	"documents" jsonb,
	"trust_score" integer,
	"expected_apy_bps" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone,
	CONSTRAINT "pools_onchain_pool_id_unique" UNIQUE("onchain_pool_id"),
	CONSTRAINT "pools_onchain_pda_unique" UNIQUE("onchain_pda")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onchain_project_id" bigint,
	"onchain_pda" text,
	"token_mint" text,
	"usdc_vault" text,
	"msme_name" text NOT NULL,
	"sector" text NOT NULL,
	"location" text NOT NULL,
	"upgrade_type" text NOT NULL,
	"target_usdc" numeric(40, 0) DEFAULT '0' NOT NULL,
	"tokens_sold" numeric(40, 0) DEFAULT '0' NOT NULL,
	"total_distributed" numeric(40, 0) DEFAULT '0' NOT NULL,
	"cumulative_per_token" numeric(40, 0) DEFAULT '0' NOT NULL,
	"term_months" integer NOT NULL,
	"status" "project_status" DEFAULT 'pending' NOT NULL,
	"mrv_project_id" uuid,
	"activated_at" timestamp with time zone,
	"description" text,
	"about_project" text,
	"highlights" jsonb,
	"management_text" text,
	"financials_text" text,
	"documents" jsonb,
	"trust_score" integer,
	"expected_apy_bps" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone,
	CONSTRAINT "projects_onchain_project_id_unique" UNIQUE("onchain_project_id"),
	CONSTRAINT "projects_onchain_pda_unique" UNIQUE("onchain_pda")
);
--> statement-breakpoint
CREATE TABLE "soft_commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"underwriting_result_id" uuid NOT NULL,
	"lender_name" text NOT NULL,
	"lender_wallet" text,
	"lender_email" text,
	"loan_amount_inr" numeric(20, 2) NOT NULL,
	"interest_rate_bps" integer,
	"tenure_months" integer,
	"p5_floor_kwh" numeric(20, 2) NOT NULL,
	"letter_pdf_url" text,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tx_sig" text NOT NULL,
	"tx_type" "tx_type" NOT NULL,
	"wallet_pubkey" text NOT NULL,
	"project_id" uuid,
	"pool_id" uuid,
	"amount_usdc" numeric(40, 0),
	"token_amount" numeric(40, 0),
	"block_time" timestamp with time zone,
	"slot" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_tx_sig_unique" UNIQUE("tx_sig")
);
--> statement-breakpoint
CREATE TABLE "underwriting_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"mrv_project_id" uuid,
	"deal_id" text NOT NULL,
	"ecm_id" text NOT NULL,
	"equipment_type" text NOT NULL,
	"sector" text NOT NULL,
	"description" text,
	"audit_inputs_json" jsonb NOT NULL,
	"prediction_json" jsonb,
	"model_used" text,
	"sigma_scale_applied" numeric(10, 4),
	"pinn_savings_kwh" numeric(20, 2),
	"pinn_p5_lower_kwh" numeric(20, 2),
	"pinn_p95_upper_kwh" numeric(20, 2),
	"pinn_sigma_kwh" numeric(20, 2),
	"confidence_grade" text,
	"baseline_kwh_per_year" numeric(20, 2) NOT NULL,
	"investment_inr" numeric(20, 2),
	"electricity_rate_inr_kwh" numeric(10, 2) DEFAULT '8.00',
	"annual_savings_inr" numeric(20, 2),
	"payback_months" numeric(10, 2),
	"p5_payback_months" numeric(10, 2),
	"recommended_loan_inr" numeric(20, 2),
	"physics_savings_kwh" numeric(20, 2),
	"status" "underwriting_status" DEFAULT 'pending' NOT NULL,
	"realized_savings_kwh" numeric(20, 2),
	"realized_at" timestamp with time zone,
	"point_estimate_delta_pct" numeric(10, 2),
	"p5_violated_flag" boolean,
	"reconciliation_passes" boolean,
	"auditor_wallet" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investor_positions" ADD CONSTRAINT "investor_positions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_positions" ADD CONSTRAINT "investor_positions_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrv_baselines" ADD CONSTRAINT "mrv_baselines_mrv_project_id_mrv_projects_id_fk" FOREIGN KEY ("mrv_project_id") REFERENCES "public"."mrv_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrv_verifications" ADD CONSTRAINT "mrv_verifications_mrv_project_id_mrv_projects_id_fk" FOREIGN KEY ("mrv_project_id") REFERENCES "public"."mrv_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_projects" ADD CONSTRAINT "pool_projects_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_projects" ADD CONSTRAINT "pool_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_mrv_project_id_mrv_projects_id_fk" FOREIGN KEY ("mrv_project_id") REFERENCES "public"."mrv_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soft_commitments" ADD CONSTRAINT "soft_commitments_underwriting_result_id_underwriting_results_id_fk" FOREIGN KEY ("underwriting_result_id") REFERENCES "public"."underwriting_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "underwriting_results" ADD CONSTRAINT "underwriting_results_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "underwriting_results" ADD CONSTRAINT "underwriting_results_mrv_project_id_mrv_projects_id_fk" FOREIGN KEY ("mrv_project_id") REFERENCES "public"."mrv_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "investor_positions_wallet_project_uq" ON "investor_positions" USING btree ("wallet_pubkey","project_id") WHERE "investor_positions"."project_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "investor_positions_wallet_pool_uq" ON "investor_positions" USING btree ("wallet_pubkey","pool_id") WHERE "investor_positions"."pool_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "projects_onchain_project_id_idx" ON "projects" USING btree ("onchain_project_id");--> statement-breakpoint
CREATE INDEX "soft_commit_underwriting_idx" ON "soft_commitments" USING btree ("underwriting_result_id");--> statement-breakpoint
CREATE INDEX "transactions_wallet_idx" ON "transactions" USING btree ("wallet_pubkey");--> statement-breakpoint
CREATE INDEX "transactions_project_idx" ON "transactions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "transactions_pool_idx" ON "transactions" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "transactions_block_time_desc_idx" ON "transactions" USING btree ("block_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "underwriting_deal_idx" ON "underwriting_results" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "underwriting_project_idx" ON "underwriting_results" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "underwriting_status_idx" ON "underwriting_results" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "underwriting_deal_ecm_uq" ON "underwriting_results" USING btree ("deal_id","ecm_id");