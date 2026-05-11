"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PoolCard, type PoolCardPool } from "@/components/investor/pool-card";

export interface PoolsListItem extends PoolCardPool {
  createdAt: string;
}

export function PoolsList({ pools }: { pools: PoolsListItem[] }) {
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");

  const filtered = useMemo(() => {
    let list = pools.slice();
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (sort === "newest") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "target") {
      list.sort((a, b) => Number(b.targetUsdc) - Number(a.targetUsdc));
    }
    return list;
  }, [pools, status, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="funding">Funding</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="distributing">Distributing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="target">Largest target</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line/60 p-12 text-center">
          <p className="text-fg">No pools available yet.</p>
          <p className="mt-1 text-sm text-fg-muted">
            Pools will aggregate multiple MSME projects into a single position.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PoolCard key={p.id} pool={p} />
          ))}
        </div>
      )}
    </div>
  );
}
