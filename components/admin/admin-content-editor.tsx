"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Highlight {
  title: string;
  detail: string;
  icon?: string;
}
export interface ProjectDocument {
  name: string;
  url: string;
}

export interface AdminContentValue {
  description: string;
  aboutProject: string;
  managementText: string;
  financialsText: string;
  apyPct: string; // stored as string for controlled input; converted to bps on submit
  trustScore: string; // 0-100 as string
  highlights: Highlight[];
  documents: ProjectDocument[];
}

export const EMPTY_CONTENT: AdminContentValue = {
  description: "",
  aboutProject: "",
  managementText: "",
  financialsText: "",
  apyPct: "",
  trustScore: "",
  highlights: [],
  documents: [],
};

export const HIGHLIGHT_ICONS: Array<{ value: string; label: string }> = [
  { value: "shield-check", label: "Shield-check (verified)" },
  { value: "shield", label: "Shield (escrow)" },
  { value: "trending-up", label: "Trending up (returns)" },
  { value: "badge-check", label: "Badge-check (MRV)" },
  { value: "leaf", label: "Leaf (impact)" },
  { value: "zap", label: "Zap (energy)" },
];

/**
 * Convert form value -> API payload. Returns null for blank/invalid fields
 * so the API can treat them as "unset".
 */
export function serializeAdminContent(v: AdminContentValue) {
  const asNull = (s: string) => (s.trim() === "" ? null : s);
  const apyNum = Number(v.apyPct);
  const trustNum = Number(v.trustScore);

  const expectedApyBps =
    v.apyPct.trim() === "" || !Number.isFinite(apyNum)
      ? null
      : Math.round(apyNum * 100);
  const trustScore =
    v.trustScore.trim() === "" || !Number.isFinite(trustNum)
      ? null
      : Math.max(0, Math.min(100, Math.round(trustNum)));

  const highlights =
    v.highlights.length === 0
      ? null
      : v.highlights
          .filter((h) => h.title.trim() !== "" || h.detail.trim() !== "")
          .map((h) => ({
            title: h.title.trim(),
            detail: h.detail.trim(),
            icon: h.icon?.trim() || undefined,
          }));

  const documents =
    v.documents.length === 0
      ? null
      : v.documents
          .filter((d) => d.name.trim() !== "" && d.url.trim() !== "")
          .map((d) => ({ name: d.name.trim(), url: d.url.trim() }));

  return {
    description: asNull(v.description),
    aboutProject: asNull(v.aboutProject),
    managementText: asNull(v.managementText),
    financialsText: asNull(v.financialsText),
    expectedApyBps,
    trustScore,
    highlights: highlights && highlights.length > 0 ? highlights : null,
    documents: documents && documents.length > 0 ? documents : null,
  };
}

/**
 * Hydrate form state from DB row values (used by edit panel).
 */
export function hydrateAdminContent(row: {
  description?: string | null;
  aboutProject?: string | null;
  aboutPool?: string | null;
  managementText?: string | null;
  financialsText?: string | null;
  expectedApyBps?: number | null;
  trustScore?: number | null;
  highlights?: Highlight[] | null;
  documents?: ProjectDocument[] | null;
}): AdminContentValue {
  return {
    description: row.description ?? "",
    // Support both project (`aboutProject`) and pool (`aboutPool`) keys.
    aboutProject: row.aboutProject ?? row.aboutPool ?? "",
    managementText: row.managementText ?? "",
    financialsText: row.financialsText ?? "",
    apyPct:
      row.expectedApyBps !== null && row.expectedApyBps !== undefined
        ? (row.expectedApyBps / 100).toString()
        : "",
    trustScore:
      row.trustScore !== null && row.trustScore !== undefined
        ? String(row.trustScore)
        : "",
    highlights: row.highlights ? row.highlights.map((h) => ({ ...h })) : [],
    documents: row.documents ? row.documents.map((d) => ({ ...d })) : [],
  };
}

interface Props {
  value: AdminContentValue;
  onChange: (v: AdminContentValue) => void;
  labelScope?: "project" | "pool";
  disabled?: boolean;
}

export function AdminContentEditor({
  value,
  onChange,
  labelScope = "project",
  disabled,
}: Props) {
  const aboutLabel =
    labelScope === "pool" ? "About the pool" : "About the project";
  const managementLabel =
    labelScope === "pool" ? "Pool management" : "Project management";

  const setField = <K extends keyof AdminContentValue>(
    k: K,
    v: AdminContentValue[K]
  ) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-6">
      {/* Description */}
      <FieldGroup>
        <Label htmlFor="description">Description</Label>
        <p className="text-xs text-fg-muted">
          Long-form narrative shown in the &quot;Upgrades &amp; Equipment&quot;
          section. Supports plain text and blank lines.
        </p>
        <Textarea
          id="description"
          rows={6}
          disabled={disabled}
          value={value.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Multi-paragraph description (optional)."
        />
      </FieldGroup>

      {/* About */}
      <FieldGroup>
        <Label htmlFor="aboutProject">{aboutLabel}</Label>
        <p className="text-xs text-fg-muted">
          Short 1-paragraph summary shown above the highlights.
        </p>
        <Textarea
          id="aboutProject"
          rows={3}
          disabled={disabled}
          value={value.aboutProject}
          onChange={(e) => setField("aboutProject", e.target.value)}
          placeholder="One-paragraph summary (optional)."
        />
      </FieldGroup>

      {/* APY + Trust */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="apyPct">Target XIRR / APY (%)</Label>
          <p className="text-xs text-fg-muted">
            Indicative annualised return shown in the sidebar and calculator.
            Stored as basis points.
          </p>
          <Input
            id="apyPct"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            max={100}
            disabled={disabled}
            value={value.apyPct}
            onChange={(e) => setField("apyPct", e.target.value)}
            placeholder="e.g. 12.5"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="trustScore">Trust Score (0–100)</Label>
          <p className="text-xs text-fg-muted">
            Shown in the &quot;Net Trust Score&quot; card. &ge;80 green, 50–79
            amber, &lt;50 red.
          </p>
          <Input
            id="trustScore"
            type="number"
            inputMode="numeric"
            step="1"
            min={0}
            max={100}
            disabled={disabled}
            value={value.trustScore}
            onChange={(e) => setField("trustScore", e.target.value)}
            placeholder="e.g. 82"
          />
        </FieldGroup>
      </div>

      {/* Highlights repeater */}
      <FieldGroup>
        <div className="flex items-center justify-between">
          <div>
            <Label>Key Highlights</Label>
            <p className="text-xs text-fg-muted">
              Up to 6 short bullets shown in the highlights grid.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || value.highlights.length >= 6}
            onClick={() =>
              setField("highlights", [
                ...value.highlights,
                { title: "", detail: "", icon: "shield-check" },
              ])
            }
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        {value.highlights.length === 0 ? (
          <p className="text-xs text-fg-muted italic">
            No highlights yet. Click &quot;Add&quot; to create one.
          </p>
        ) : (
          <ul className="space-y-3">
            {value.highlights.map((h, i) => (
              <li
                key={i}
                className="space-y-2 rounded-lg border border-line/60 bg-bg-1/40 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
                  <Input
                    disabled={disabled}
                    placeholder="Title (e.g. Escrow Secured)"
                    value={h.title}
                    onChange={(e) => {
                      const next = [...value.highlights];
                      next[i] = { ...h, title: e.target.value };
                      setField("highlights", next);
                    }}
                  />
                  <Select
                    value={h.icon ?? "shield-check"}
                    onValueChange={(v) => {
                      const next = [...value.highlights];
                      next[i] = { ...h, icon: v };
                      setField("highlights", next);
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HIGHLIGHT_ICONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => {
                      const next = value.highlights.filter((_, idx) => idx !== i);
                      setField("highlights", next);
                    }}
                    aria-label="Remove highlight"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="Short detail"
                  value={h.detail}
                  onChange={(e) => {
                    const next = [...value.highlights];
                    next[i] = { ...h, detail: e.target.value };
                    setField("highlights", next);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </FieldGroup>

      {/* Management & Financials */}
      <FieldGroup>
        <Label htmlFor="managementText">{managementLabel}</Label>
        <Textarea
          id="managementText"
          rows={4}
          disabled={disabled}
          value={value.managementText}
          onChange={(e) => setField("managementText", e.target.value)}
          placeholder="Who operates it, monitoring, design life, etc."
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="financialsText">Financials &amp; returns</Label>
        <Textarea
          id="financialsText"
          rows={4}
          disabled={disabled}
          value={value.financialsText}
          onChange={(e) => setField("financialsText", e.target.value)}
          placeholder="How cashflows are generated and distributed."
        />
      </FieldGroup>

      {/* Documents repeater */}
      <FieldGroup>
        <div className="flex items-center justify-between">
          <div>
            <Label>Documents</Label>
            <p className="text-xs text-fg-muted">
              PDFs, feasibility reports, term sheets — anything an investor
              would want to download.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || value.documents.length >= 24}
            onClick={() =>
              setField("documents", [
                ...value.documents,
                { name: "", url: "" },
              ])
            }
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        {value.documents.length === 0 ? (
          <p className="text-xs italic text-fg-muted">
            No documents yet. Use the &quot;Add&quot; button to attach one.
          </p>
        ) : (
          <ul className="space-y-2">
            {value.documents.map((d, i) => (
              <li
                key={i}
                className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Input
                  disabled={disabled}
                  placeholder="Display name (e.g. Baseline Report.pdf)"
                  value={d.name}
                  onChange={(e) => {
                    const next = [...value.documents];
                    next[i] = { ...d, name: e.target.value };
                    setField("documents", next);
                  }}
                />
                <Input
                  disabled={disabled}
                  placeholder="https://…"
                  value={d.url}
                  onChange={(e) => {
                    const next = [...value.documents];
                    next[i] = { ...d, url: e.target.value };
                    setField("documents", next);
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => {
                    const next = value.documents.filter(
                      (_, idx) => idx !== i
                    );
                    setField("documents", next);
                  }}
                  aria-label="Remove document"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </FieldGroup>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

/** Small helper: use outside components that want a simple hook-style API. */
export function useAdminContentState(initial?: Partial<AdminContentValue>) {
  const [state, setState] = useState<AdminContentValue>({
    ...EMPTY_CONTENT,
    ...(initial ?? {}),
  });
  return [state, setState] as const;
}
