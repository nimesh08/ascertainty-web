"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export function useIsAdmin() {
  const { authenticated, user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const wallet = authenticated ? user?.wallet?.address : undefined;

  useEffect(() => {
    if (!wallet) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/check?wallet=${encodeURIComponent(wallet)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((data) => {
        if (!cancelled) setIsAdmin(Boolean(data?.isAdmin));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  return { isAdmin, loading };
}
