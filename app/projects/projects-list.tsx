"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProjectCard, type ProjectCardProject } from "@/components/investor/project-card";

export interface ProjectsListItem extends ProjectCardProject {
  createdAt: string;
}

export function ProjectsList({ projects }: { projects: ProjectsListItem[] }) {
  const [status, setStatus] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");

  const sectors = useMemo(
    () => Array.from(new Set(projects.map((p) => p.sector))).sort(),
    [projects]
  );

  const filtered = useMemo(() => {
    let list = projects.slice();
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (sector !== "all") list = list.filter((p) => p.sector === sector);
    if (sort === "newest") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "target") {
      list.sort((a, b) => Number(b.targetUsdc) - Number(a.targetUsdc));
    } else if (sort === "apy") {
      list.sort((a, b) => b.termMonths - a.termMonths);
    }
    return list;
  }, [projects, status, sector, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="funding">Funding</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="repaying">Repaying</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              {sectors.map((s) => {
                const display = s.replace(/_/g, " ");
                return (
                  <SelectItem key={s} value={s}>
                    {display.charAt(0).toUpperCase() + display.slice(1)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="apy">Longest term</SelectItem>
            <SelectItem value="target">Largest target</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line/60 p-12 text-center">
          <p className="text-fg">No projects match your filters.</p>
          <p className="mt-1 text-sm text-fg-muted">
            Try adjusting the status or sector.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/pools">Browse pools instead</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
