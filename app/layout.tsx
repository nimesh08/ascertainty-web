import type { Metadata } from "next";
import "./globals.css";
import { poppins, geistMono } from "./fonts";
import { Providers } from "./providers";
import { BackgroundFX } from "@/components/layout/background-fx";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Ascertainty — Capital that meters itself",
  description:
    "Calibrated underwriting for Indian MSME industrial energy retrofits. Every kilowatt-hour of predicted savings is bounded by a verifiable conformal prediction interval; every repayment is settled at the meter.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable}`}
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
