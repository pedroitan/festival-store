import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { headers } from "next/headers";
import "./globals.css";
import { getTenantBySlug } from "@/lib/tenant";
import TenantProvider from "@/components/TenantProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const neocrash = localFont({
  src: "./fonts/neocrash.ttf",
  variable: "--font-neocrash",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BTC Festival Store — Arte Urbana em Produtos Exclusivos",
  description: "Arte original de grafiteiros do Festival Bahia de Todas as Cores em camisetas, pôsteres e telas.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "BTC Festival Store",
    description: "Arte original de grafiteiros do Festival Bahia de Todas as Cores em camisetas, pôsteres e telas.",
    url: "https://festival-store.vercel.app",
    siteName: "BTC Festival Store",
    images: [
      {
        url: "https://festival-store.vercel.app/og-image.png",
        width: 630,
        height: 840,
        alt: "Bahia de Todas as Cores — Festival Store",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BTC Festival Store",
    description: "Arte original de grafiteiros do Festival Bahia de Todas as Cores.",
    images: ["https://festival-store.vercel.app/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const slug = headersList.get("x-tenant-slug") ?? "btcfestival";
  const tenant = await getTenantBySlug(slug);

  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable} ${neocrash.variable}`}>
      <body className="antialiased bg-background text-text">
        <TenantProvider tenant={tenant}>
          <Navbar />
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
