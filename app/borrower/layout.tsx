import { Container } from "@/components/layout/container";

export const dynamic = "force-dynamic";

/**
 * Borrower (MSME) layout. v0.2 is a read-only preview — no auth check yet.
 * The full RBAC story (per-deal scoping, owner-only writes) ships when the
 * first vault launches.
 *
 * Designed mobile-first by intent: MSME owners check this from a phone, not a
 * desktop. The outer container constrains to a phone-width even on desktop so
 * the demo always shows the mobile UX.
 */
export default function BorrowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="py-6 sm:py-10">
      <div className="mx-auto max-w-md">{children}</div>
    </Container>
  );
}
