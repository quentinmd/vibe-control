import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vibe Control - Playlist Collaborative",
  description:
    "Contrôlez la vibe de votre soirée avec des suggestions musicales validées",
  manifest: "/manifest.json",
  themeColor: "#9D4EDD",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
