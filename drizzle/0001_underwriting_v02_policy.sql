-- v0.2 underwriting policy additions — UNDERWRITING_POLICY.md fields
-- Additive only: all new columns nullable; existing rows remain valid.

-- §5.1 EBITDA backstop
ALTER TABLE "underwriting_results" ADD COLUMN "borrower_ebitda_inr" numeric(20, 2);--> statement-breakpoint
ALTER TABLE "underwriting_results" ADD COLUMN "ebitda_coverage_ratio" numeric(10, 4);--> statement-breakpoint

-- §5.1 cached DSCR computations
ALTER TABLE "underwriting_results" ADD COLUMN "dscr_at_p5" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "underwriting_results" ADD COLUMN "dscr_at_p50" numeric(10, 4);--> statement-breakpoint

-- §4-5 eligibility evaluation results
ALTER TABLE "underwriting_results" ADD COLUMN "eligibility_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "underwriting_results" ADD COLUMN "ineligibility_reasons" jsonb;--> statement-breakpoint

-- §11 carbon credit treatment
ALTER TABLE "underwriting_results" ADD COLUMN "carbon_eligible" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "underwriting_results" ADD COLUMN "carbon_tco2_per_year" numeric(20, 2);--> statement-breakpoint
ALTER TABLE "underwriting_results" ADD COLUMN "carbon_methodology" text;--> statement-breakpoint

CREATE INDEX "underwriting_eligibility_idx" ON "underwriting_results" USING btree ("eligibility_status");--> statement-breakpoint

-- §5.5 concentration tracking
CREATE TABLE "vault_allocations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "vault_id" text NOT NULL,
    "underwriting_result_id" uuid NOT NULL,
    "nav_bps" integer NOT NULL,
    "sector" text,
    "state" text,
    "equipment_category" text,
    "auditor_wallet" text,
    "added_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "vault_allocations"
    ADD CONSTRAINT "vault_allocations_underwriting_result_id_underwriting_results_id_fk"
    FOREIGN KEY ("underwriting_result_id") REFERENCES "public"."underwriting_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "vault_alloc_vault_idx" ON "vault_allocations" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "vault_alloc_underwriting_idx" ON "vault_allocations" USING btree ("underwriting_result_id");
