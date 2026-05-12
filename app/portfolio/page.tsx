import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { PortfolioClient } from "./portfolio-client";

export const dynamic = "force-dynamic";

export default function PortfolioPage() {
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        kicker="Portfolio"
        title="Your positions."
        description="Positions, claimable distributions, and transaction history — all pulled live from Solana devnet."
      />
      <PortfolioClient />
    </Container>
  );
}
