import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "NeuroLoom | Autonomous AI Vault",
  description: "Enterprise-grade DeFi Yield Optimizer on BSC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* KITA HAPUS data-theme dan bg-base-300. Biarkan CSS custom kita yang bekerja! */}
      <body className="font-sans antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
