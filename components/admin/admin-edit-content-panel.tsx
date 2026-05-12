"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminContentEditor,
  hydrateAdminContent,
  serializeAdminContent,
  type Highlight,
  type ProjectDocument,
  type AdminContentValue,
} from "./admin-content-editor";

interface Props {
  scope: "project" | "pool";
  id: string;
  initial: {
    description: string | null;
    aboutProject?: string | null;
    aboutPool?: string | null;
    managementText: string | null;
    financialsText: string | null;
    expectedApyBps: number | null;
    trustScore: number | null;
    highlights: Highlight[] | null;
    documents: ProjectDocument[] | null;
  };
}

export function AdminEditContentPanel({ scope, id, initial }: Props) {
  const [value, setValue] = useState<AdminContentValue>(() =>
    hydrateAdminContent(initial)
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const payload = serializeAdminContent(value);
      // For pools we ship the same "about" text under `aboutPool`.
      const body =
        scope === "pool"
          ? (() => {
              const { aboutProject, ...rest } = payload;
              return { ...rest, aboutPool: aboutProject };
            })()
          : payload;

      const endpoint =
        scope === "pool"
          ? `/api/admin/pools/${id}`
          : `/api/admin/projects/${id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(detail.error ?? `HTTP ${res.status}`);
      }
      toast.success("Content saved", {
        description: "Investor detail page will update on next load.",
      });
    } catch (err) {
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">
            Edit {scope === "pool" ? "pool" : "project"} details
          </CardTitle>
          <p className="text-xs text-fg-muted">
            Description, highlights, documents, APY, and trust score shown on
            the public detail page. None of these are on-chain.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={saving}
          className="shrink-0"
        >
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="size-3.5" /> Save
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <AdminContentEditor
          value={value}
          onChange={setValue}
          labelScope={scope}
          disabled={saving}
        />
      </CardContent>
    </Card>
  );
}
