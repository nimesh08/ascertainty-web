import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { AuditorIntakeForm } from "@/components/auditor/intake-form";
import { getAuditorSession } from "@/lib/auditor/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditorIntakePage() {
  const session = await getAuditorSession();
  if (!session) {
    redirect("/?error=auditor-required");
  }
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        kicker="Auditor intake"
        title="Compressed-air leakage ECM"
        description="Five fields. Live confidence band. Persist when ready, then share the lender preview link."
      />
      <div className="mt-8">
        <AuditorIntakeForm />
      </div>
    </Container>
  );
}
