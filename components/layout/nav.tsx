"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useIsAdmin } from "@/lib/hooks/use-is-admin";
import { WalletBalancesPill } from "@/components/layout/wallet-balances-pill";

interface NavLink {
  label: string;
  href: string;
  admin?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Projects", href: "/projects" },
  { label: "Pools", href: "/pools" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Admin", href: "/admin", admin: true },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        aria-hidden
        className="relative block size-7 rounded-full"
        style={{
          background:
            "conic-gradient(from 140deg at 50% 50%, #4ade80 0deg, #67e8f9 120deg, #a78bfa 240deg, #4ade80 360deg)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06), 0 6px 20px rgba(74,222,128,0.25)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-[3px] rounded-full"
          style={{ backgroundColor: "#07090a" }}
        />
        <span
          aria-hidden
          className="absolute inset-[9px] rounded-full"
          style={{ backgroundColor: "#4ade80" }}
        />
      </span>
      <span className="font-medium tracking-tight text-fg">Exira</span>
    </Link>
  );
}

function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  if (!ready) {
    return (
      <Button size="sm" disabled className="min-w-[110px]">
        Loading…
      </Button>
    );
  }
  if (!authenticated) {
    return (
      <Button size="sm" onClick={() => login()} className="min-w-[110px]">
        Connect wallet
      </Button>
    );
  }
  const primary =
    user?.wallet?.address ??
    user?.linkedAccounts.find((a) => "address" in a && a.address)?.["address" as never];
  const short = primary
    ? `${String(primary).slice(0, 4)}…${String(primary).slice(-4)}`
    : "Connected";
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => logout()}
      className="mono-num min-w-[110px]"
    >
      {short}
    </Button>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);

  const visibleLinks = useMemo(
    () => NAV_LINKS.filter((l) => (l.admin ? isAdmin : true)),
    [isAdmin]
  );

  return (
    <header className="sticky top-0 z-40 w-full pt-3">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between rounded-full border border-line/70 bg-bg-1/70 pl-4 pr-2 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <Logo />
            <NavigationMenu className="hidden md:block">
              <NavigationMenuList className="gap-1">
                {visibleLinks.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <NavigationMenuItem key={link.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={link.href}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "bg-transparent text-sm text-fg-muted data-[active=true]:bg-bg-2/80 data-[active=true]:text-fg",
                            active && "bg-bg-2/80 text-fg"
                          )}
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-2">
            <WalletBalancesPill />
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[82%] sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4 pb-8">
                  {visibleLinks.map((link) => {
                    const active =
                      pathname === link.href ||
                      (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-bg-2 text-fg"
                            : "text-fg-muted hover:bg-bg-2/60 hover:text-fg"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="mt-4 border-t border-line/60 pt-4 sm:hidden">
                    <ConnectButton />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
