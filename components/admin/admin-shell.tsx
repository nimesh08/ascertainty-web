"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Users,
  FileBarChart2,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Pools", href: "/admin/pools", icon: Layers },
  { label: "Auditors", href: "/admin/auditors", icon: Users },
  { label: "MRV", href: "/admin/mrv", icon: FileBarChart2 },
  { label: "Roles", href: "/roles", icon: ShieldCheck },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent/10 text-fg"
                : "text-fg-muted hover:bg-bg-2/60 hover:text-fg"
            )}
          >
            <Icon className={cn("size-4", active && "text-accent")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  adminWallet,
}: {
  children: React.ReactNode;
  adminWallet: string;
}) {
  const [open, setOpen] = useState(false);
  const shortWallet = `${adminWallet.slice(0, 4)}…${adminWallet.slice(-4)}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-fg-muted">
              Admin
            </p>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent" />
              <span className="text-sm font-medium text-fg">Control panel</span>
            </div>
          </div>
          <NavLinks />
          <div className="rounded-md border border-line/70 bg-bg-1/60 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-fg-muted">
              Signer
            </p>
            <p className="mono-num mt-1 text-xs text-fg/90">{shortWallet}</p>
            <Badge variant="outline" className="mt-2 border-accent/40 bg-accent/10 text-accent text-[10px]">
              admin
            </Badge>
          </div>
        </div>
      </aside>

      {/* Mobile drawer trigger */}
      <div className="fixed left-3 top-[84px] z-30 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="size-9 rounded-full border-accent/40 bg-bg-1/80 backdrop-blur"
              aria-label="Open admin menu"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] sm:max-w-xs">
            <SheetHeader>
              <SheetTitle>Admin</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-6 rounded-md border border-line/70 bg-bg-1/60 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                  Signer
                </p>
                <p className="mono-num mt-1 text-xs text-fg/90">{shortWallet}</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="min-w-0 flex-1 pb-24 lg:pb-10">{children}</main>
    </div>
  );
}
