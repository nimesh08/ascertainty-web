import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/?error=admin-required");
  }
  return <AdminShell adminWallet={session.wallet}>{children}</AdminShell>;
}
