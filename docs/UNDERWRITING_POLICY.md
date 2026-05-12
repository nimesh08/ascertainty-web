# Exira Underwriting Policy

**Version:** 1.0 (Draft)
**Effective:** 2026-05-12
**Owner:** Exira Risk Committee
**Status:** Public — published for LP and borrower transparency

---

## 1. Purpose

This document defines the criteria, thresholds, and processes Exira applies when originating, underwriting, and approving loans for inclusion in any Exira-managed vault. It is published as the single source of truth for what Exira will and will not finance, and at what risk parameters.

The policy serves three audiences:

- **Liquidity Providers (LPs)** — to verify, before deploying capital, the rules every loan in every vault is required to meet.
- **Borrowers** — to understand the eligibility criteria and documentation requirements before applying.
- **Partners (auditors, NBFCs, regulators)** — to align operations against a known standard.

This policy is binding. No loan may be added to an Exira vault unless it clears every requirement below or is granted a documented exception by the Risk Committee.

---

## 2. Scope

This policy applies to:

- All debt instruments originated by Exira or originated by a partner and tokenized into an Exira-managed vault.
- All vault structures (single-borrower, multi-borrower pooled, tranched).
- All currencies (USDC settlement layer; INR or other local-currency disbursement via licensed NBFC partner).

This policy does not cover equity, mezzanine warrants, or carbon-credit-only instruments, which are governed by separate policies.

---

## 3. Definitions

| Term | Definition |
|---|---|
| **DSCR** | Debt Service Coverage Ratio. Annual cash flow available to service debt divided by annual debt service (principal + interest). |
| **DSCR at P5** | DSCR computed using the 5th-percentile lower bound of the Exira PINN's energy-savings prediction. The conservative case. |
| **EBITDA** | Earnings Before Interest, Tax, Depreciation, Amortization. The borrower's operating cash flow before financial deductions. |
| **EBITDA Coverage** | Borrower's trailing-twelve-month EBITDA divided by annual debt service. The fallback case if retrofit savings fail entirely. |
| **PD / EAD / LGD** | Probability of Default / Exposure at Default / Loss Given Default. Standard credit-risk decomposition. |
| **Tenor** | Loan duration from disbursement to scheduled maturity. |
| **P5 / P50 / P95** | 5th, 50th, 95th percentile predictions from the Exira PINN's calibrated savings distribution. |
| **M&V** | Measurement and Verification. Post-install instrumentation that records realized energy consumption to validate predicted savings. Aligned with IPMVP (International Performance Measurement and Verification Protocol). |
| **KISEM** | Kotak IIT-Madras Save Energy Mission. Exira's primary audit partner; also accepts loans audited by any BEE-accredited Energy Auditor. |
| **NBFC** | Non-Banking Financial Company. RBI-regulated Indian lender that handles INR disbursement and collection. |
| **Vault** | A tokenized loan portfolio issued under Exira-managed structures (initially Centrifuge V3 whitelabel or Huma Institutional rails). |

---

## 4. Eligibility Criteria

### 4.1 Borrower eligibility

A borrower is eligible if and only if all of the following are true:

- **Legal form:** Indian Private Limited Company, Public Limited Company, or LLP. Sole proprietorships and partnerships ineligible in v0.
- **Vintage:** Minimum 5 years of continuous operations as of loan application date.
- **Financial filing:** Audited financial statements available for the most recent 3 fiscal years.
- **GST registration:** Active GSTIN with no suspension or cancellation in trailing 24 months.
- **Tax compliance:** No outstanding income tax demands; current on GST filings.
- **Credit history:** Promoter CIBIL score ≥ 700; entity CIBIL MSME rank ≤ 6; no NPA classification at any bank in trailing 36 months.
- **Litigation:** No pending litigation with potential liability exceeding 20% of proposed loan size.
- **Geography:** Operations physically located in India (v0). Other geographies subject to separate policy addendum.

### 4.2 Asset eligibility

The retrofit project (energy conservation measure, "ECM") must:

- Be classified within Exira's covered equipment categories: compressed air systems, motors, lighting, HVAC, refrigeration, variable frequency drives (VFDs), heat recovery, boilers/furnaces, fans, pumps, chillers, humidification, AWES.
- Have measurable baseline energy consumption documented in a KISEM or BEE-licensed auditor's investment-grade audit (IGA) report, dated within 12 months of loan application.
- Have an Exira PINN prediction generated under the v0.1 routing recipe:
  - If `equipment_type == "compressed_air"` and leakage percentage is measured: route to `exira_pinn_compressed_air_v1.pt` (σ-scale 2.82).
  - Else: route to `exira_pinn_unified_v1.pt` (per-category σ-scale, default 1.36).
- Have prediction quality grade A or B (defined in §5.4). Grade C predictions ineligible.

### 4.3 Audit eligibility

The supporting audit must be:

- Conducted by a KISEM-affiliated auditor or a BEE-accredited Energy Auditor (EA) or Energy Manager (EM).
- Investment-grade (IGA), not a preliminary or walk-through audit.
- Inclusive of: equipment specifications, baseline consumption (minimum 12 months meter data), proposed ECM specifications, projected savings, payback period, and CapEx breakdown.
- Available in machine-readable form (.tex source preferred; PDF acceptable with extraction validation).

---

## 5. Quantitative Thresholds

### 5.1 Debt service coverage

| Metric | Threshold | Rationale |
|---|---|---|
| **DSCR at P5** | ≥ 1.30x | Project finance industry minimum; matches IFC EM SME standards |
| **DSCR at P50** | ≥ 1.75x | Sanity check on central-case economics |
| **EBITDA Coverage** | ≥ 1.80x | Survives ~45% adverse EBITDA shock; backstop if retrofit produces zero savings |

All three must be cleared simultaneously. Failure on any single metric disqualifies the loan.

### 5.2 Tenor

| Constraint | Limit |
|---|---|
| **Minimum tenor** | 24 months |
| **Maximum tenor** | 60 months |
| **Tenor vs payback ratio** | Loan tenor must be between 1.0× and 1.5× of project simple payback period. Prevents over-lending on short-payback projects (free money to borrower) and under-lending on long-payback projects (DSCR collapse). |

### 5.3 Loan sizing

| Constraint | Limit |
|---|---|
| **Minimum loan** | ₹25 lakh (~$30K USD) |
| **Maximum loan (single borrower, single vault)** | ₹5 crore (~$600K USD) for v0. Subject to Risk Committee uplift in v1+. |
| **Loan-to-CapEx ratio** | Maximum 90% of audited equipment CapEx. Borrower contributes minimum 10% equity. |

### 5.4 Prediction quality grading

The Exira PINN's prediction quality is graded per loan based on calibrated uncertainty:

| Grade | Coefficient of Variation (σ / μ) | Eligibility |
|---|---|---|
| **A** | < 25% | Eligible without conditions |
| **B** | 25% – 45% | Eligible with enhanced M&V (monthly meter readings vs quarterly) |
| **C** | > 45% | Ineligible. Must re-audit with additional measurements to tighten prediction. |

Grade is computed at vault inclusion using the routed model's σ output, scaled by the per-category σ-scale stored in the model checkpoint.

### 5.5 Concentration limits (per vault)

| Dimension | Limit |
|---|---|
| Single borrower | ≤ 15% of vault NAV |
| Single sector (textile, cold chain, foundry, etc.) | ≤ 40% of vault NAV |
| Single equipment category | ≤ 50% of vault NAV |
| Single state (Tamil Nadu, Karnataka, etc.) | ≤ 60% of vault NAV |
| Single auditor firm | ≤ 70% of vault NAV |

### 5.6 Pricing floor

Borrower coupon rate must clear:

- Cost of capital floor (USDC LP yield + cross-currency hedge cost + NBFC servicing fee + Exira platform fee + risk premium).
- Minimum 200 bps spread over Indian MCLR-equivalent benchmark for comparable secured MSME debt.

Indicative all-in borrower rate range for v0: **13.5% – 16.5% per annum (INR)**.

---

## 6. Documentation Requirements

Every loan file must contain, at vault inclusion:

1. **Audit report** — full IGA from KISEM or BEE-accredited auditor, machine-readable.
2. **PINN prediction record** — model version, σ-scale applied, P5/P50/P95 outputs, prediction grade, hash of input feature vector.
3. **Borrower financials** — last 3 years audited statements + last 12 months bank statements + GST returns.
4. **Credit bureau reports** — entity CIBIL MSME rank + promoter CIBIL.
5. **Equipment quotation** — vendor invoice or PO for ECM equipment.
6. **Collateral package** — equipment hypothecation deed, promoter personal guarantee, any additional security.
7. **NBFC sanction letter** — if disbursement intermediated through NBFC partner.
8. **Insurance** — equipment all-risks insurance policy, Exira/NBFC named loss payee.
9. **M&V plan** — sensor specification, installation timeline, data ingestion endpoint.
10. **Soft commitment letter** — issued by Exira to borrower under §7.

---

## 7. Underwriting Process

```
Day 0    Audit kickoff (KISEM auditor begins on-site work)
Day 1–2  Auditor enters baseline data via Exira portal
Day 3    Compressor / motor performance tests; auditor enters specs
Day 5    Exira PINN generates first preview prediction band
         Lender preview UI shows live DSCR-at-P5
Day 5–10 Lender reviews preview; issues SOFT COMMITMENT LETTER
         (subject to final audit, KYC, and documentation)
Day 8–15 Auditor completes additional measurements
         PINN bands tighten; lender preview updates
Day 30   Auditor delivers final IGA report
Day 30   Final PINN prediction locked; final DSCR computed
Day 30   Risk Committee reviews; HARD COMMITMENT issued if
         all §5 thresholds cleared
Day 35   NBFC disbursement to borrower
Day 35   Vault tokens minted; LP capital deployed
Day 60   Equipment installation complete
Day 60   M&V sensors installed; baseline measurement begins
Day 90+  First post-install M&V data flows; realized savings compared
         to PINN prediction; portfolio learning loop closes
```

The soft commitment letter (Day 5–10) is the workflow innovation: it parallelizes the financing decision with the audit process. The final loan decision is not made until Day 30, but the borrower has financing visibility within the first week.

---

## 8. Exclusions

Exira will not finance:

- Coal, oil, or gas-fired equipment retrofits unless the retrofit eliminates fossil-fuel use entirely.
- Borrowers in tobacco, weapons, gambling, or sectors flagged on the IFC Exclusion List.
- Borrowers under active bankruptcy, IBC proceedings, or with NPA classification at any bank in trailing 36 months.
- Equipment categories outside the v0 covered list (see §4.2).
- Projects without an investment-grade audit.
- Projects where prediction grade is C (see §5.4).
- Projects where promoter is unable or unwilling to provide personal guarantee.

---

## 9. Default and Recovery Framework

### 9.1 Default triggers

A loan is classified as in default upon any of:

- 90+ days past due on scheduled payment.
- Borrower files for IBC proceedings.
- Material adverse change in borrower's business resulting in DSCR projection falling below 1.0x for 2+ consecutive quarters.
- Insurance lapse or material misrepresentation discovered.

### 9.2 Recovery hierarchy

Upon default, recovery actions proceed in order:

1. **Cure period (30 days)** — borrower notified, given opportunity to cure.
2. **Equipment repossession** — under SARFAESI Act; equipment hypothecation enforced via NBFC partner.
3. **Promoter personal guarantee** — invoked for shortfall.
4. **Insurance claim** — filed for any covered cause of loss.
5. **Court recovery** — Debt Recovery Tribunal (DRT) for residual amounts.

### 9.3 Loss allocation in tranched vaults

Where vaults are tranched (v1+):

- Junior tranche absorbs first loss up to its full principal.
- Mezzanine tranche absorbs second loss.
- Senior tranche absorbs only after junior and mezzanine are fully exhausted.

Indicative recovery rate for secured MSME loans in India under SARFAESI: 50–70% over 18–24 months. Underwriting assumes 40% LGD as conservative base case.

---

## 10. Measurement and Verification (M&V)

### 10.1 Sensor requirements

Every financed retrofit must have post-install instrumentation:

- Energy meter on the retrofitted equipment circuit, minimum Class 1 accuracy.
- Cellular or Wi-Fi data uplink, minimum hourly transmission frequency.
- Approved hardware vendors: Schneider Electric, Trinity Energy Systems, Zenatix, Smart Joules, ABB. Other vendors subject to Exira technical approval.
- Sampling rate: 1-minute for compressed air; 15-minute for all other categories.

### 10.2 Data ingestion

- Sensor data flows to Exira ingestion endpoint.
- Hashes of monthly aggregated readings committed on-chain for tamper-evidence.
- LP dashboard exposes time-series view per loan (anonymized borrower ID).

### 10.3 M&V protocol alignment

All measurement and verification follows IPMVP Option B (retrofit isolation with all-parameter measurement) or Option C (whole-facility) as appropriate per ECM type. Methodology selection documented per loan.

### 10.4 Realization variance handling

If realized savings deviate materially from PINN P5 prediction (defined as 12-month rolling realized falling below P5 for 2+ consecutive quarters):

- Loan flagged for enhanced monitoring.
- Exira investigates: equipment failure, operator behavior change, baseline misclassification.
- Per-category σ-scales recalibrated quarterly based on realized vs predicted variance across the portfolio.

---

## 11. Carbon Credit Treatment

For loans where the underlying ECM qualifies under Verra VCS (AMS-II.D or successor methodologies) or Gold Standard for energy efficiency:

- The vault retains rights to generated carbon credits.
- Verification and certificate issuance costs (~$5–15K per project) are funded from vault reserves and amortized across loan tenor.
- Carbon credit sale proceeds flow to the vault and are distributed to LPs as supplemental yield, net of platform fee (10% of carbon-credit gross proceeds).
- Carbon revenue is not counted toward DSCR computation. It is treated as upside, not as underwriting credit support.

---

## 12. LP Disclosure and Transparency

Every Exira vault publishes, per individual loan:

| Field | Visibility |
|---|---|
| Borrower anonymized ID | Public |
| Sector and sub-sector | Public |
| Plant size (turnover band, headcount band) | Public |
| State of operations | Public |
| Equipment category and ECM type | Public |
| Baseline kWh (audited) | Public |
| PINN prediction P5 / P50 / P95 | Public |
| Prediction grade (A/B) | Public |
| DSCR at P5, DSCR at P50 | Public |
| EBITDA Coverage | Public |
| Tenor, coupon, repayment schedule | Public |
| Outstanding principal, days past due | Public, real-time |
| M&V time-series | Public, daily refresh |
| Carbon credit issuance status | Public |
| Borrower legal name and full financials | Restricted to whitelisted accredited LPs under NDA |

---

## 13. Governance and Policy Updates

### 13.1 Risk Committee

The Risk Committee comprises:

- Chief Risk Officer (or fractional risk advisor in v0; full-time hire by v1)
- Chief Technology Officer (Yuxin)
- Chief Operating Officer (Nimesh)
- One independent member with credit-fund experience (target: by Phase 2)

### 13.2 Policy review

This policy is reviewed:

- Quarterly, with portfolio data informing recalibration of σ-scales and concentration limits.
- Whenever a new equipment category, geography, or vault structure is introduced.
- Whenever realized portfolio loss rate exceeds underwriting assumptions by >50%.

### 13.3 Exception process

Exceptions to thresholds in §5 may be granted only by unanimous Risk Committee vote, must be documented in the loan file with explicit rationale, and are reported to LPs in the next quarterly disclosure. Exceptions may not exceed 10% of any vault's NAV in aggregate.

---

## 14. Disclosures and Limitations

- Past performance does not guarantee future results.
- PINN predictions carry calibrated but non-zero uncertainty. The P5 lower bound is a statistical estimate, not a guarantee.
- Exira is not a regulated investment adviser. This document is published for transparency, not as investment advice.
- v0 vaults are restricted to accredited investors and qualified institutional buyers as defined under Singapore SFA and applicable jurisdictions.
- For regulatory and disclosure status, see [www.exira.io](https://exira.io/) and the relevant vault subscription documents.

---

## 15. Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 (Draft) | 2026-05-12 | Exira Risk Committee | Initial draft. Codifies v0 underwriting rubric established during 2026-05 strategy work. |

---

*This document is the binding underwriting standard for Exira-managed vaults. Subscribers, borrowers, and partners should refer to this document — not to marketing materials — as the authoritative source for what Exira will and will not finance.*
