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
import { useIsAdmin } from "@/lib/hooks/use-is-admin";
import { WalletBalancesPill } from "@/components/layout/wallet-balances-pill";
import { CoinMark } from "@/components/layout/coin-mark";

interface NavLink {
  label: string;
  href: string;
  admin?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Projects", href: "/projects" },
  { label: "Pools", href: "/pools" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "How it works", href: "/#05-mechanics" },
  { label: "Docs", href: "/docs/underwriting-policy" },
  { label: "Admin", href: "/admin", admin: true },
];

function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  if (!ready) {
    return (
      <button className="a-connect-btn" disabled style={{ opacity: 0.5 }}>
        Loading…
      </button>
    );
  }
  if (!authenticated) {
    return (
      <button className="a-connect-btn" onClick={() => login()}>
        Connect →
      </button>
    );
  }
  const primary =
    user?.wallet?.address ??
    (user?.linkedAccounts.find((a) => "address" in a && a.address) as
      | { address?: string }
      | undefined)?.address;
  const short = primary
    ? `${String(primary).slice(0, 4)}…${String(primary).slice(-4)}`
    : "Connected";
  return (
    <button className="a-connect-btn mono-num" onClick={() => logout()}>
      {short}
    </button>
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
    <nav className="a-nav">
      <Link className="a-nav__brand" href="/">
        <CoinMark size={32} variant="ink" animateOnScroll scrollThresholdPx={480} />
        <span>ASCERTAINTY</span>
      </Link>

      <div className="a-nav__links">
        {visibleLinks.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/" && !link.href.startsWith("/#") && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className="a-nav__link"
              aria-current={active ? "true" : undefined}
            >
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="a-nav__right">
        <div className="hidden md:block">
          <WalletBalancesPill />
        </div>
        <div className="hidden sm:block">
          <ConnectButton />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn("md:hidden")}
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
                      "px-3 py-2 text-sm uppercase tracking-[0.18em]",
                      active ? "text-fg" : "text-fg-muted hover:text-fg"
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
    </nav>
  );
}
