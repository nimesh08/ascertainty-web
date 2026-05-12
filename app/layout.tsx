import type { Metadata } from "next";
import "./globals.css";
import { poppins, geistMono, serif } from "./fonts";
import { Providers } from "./providers";
import { BackgroundFX } from "@/components/layout/background-fx";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Ascertainty — On-chain MSME climate finance",
  description:
    "Ascertainty is a Solana protocol that channels community capital into measurable MSME energy upgrades.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body className="overflow-x-clip antialiased">
        <Providers>
          <BackgroundFX />
          <Nav />
          <main className="min-h-[calc(100dvh-120px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
