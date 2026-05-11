import { PageHeader } from "@/components/layout/page-header";
import { NewPoolForm } from "@/components/admin/new-pool-form";

export const dynamic = "force-dynamic";

export default function NewPoolPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title="New pool"
        description="Mints a fresh pool token and opens a USDC vault for investor subscriptions."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Pools", href: "/admin/pools" },
          { label: "New" },
        ]}
      />
      <NewPoolForm />
    </div>
  );
}
