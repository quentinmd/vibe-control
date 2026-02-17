import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "Vibe Control - Playlist Collaborative pour Soirées | Contrôlez la Musique",
  description:
    "Créez une playlist collaborative où vous gardez le contrôle total. Vos invités suggèrent des morceaux via QR code, vous validez en temps réel. Parfait pour soirées, bars, événements.",
  keywords: [
    "playlist collaborative",
    "musique soirée",
    "QR code musique",
    "DJ collaboratif",
    "playlist participative",
    "gestion playlist",
    "soirée musicale",
    "événement musique",
  ],
  authors: [{ name: "Vibe Control" }],
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://vibecontrol.app",
    siteName: "Vibe Control",
    title: "Vibe Control - Playlist Collaborative pour Soirées",
    description:
      "La playlist collaborative où l'hôte garde le contrôle. QR code, suggestions en temps réel, validation instantanée.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vibe Control - Playlist Collaborative",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Control - Playlist Collaborative",
    description:
      "Contrôlez la vibe de votre soirée avec des suggestions musicales validées en temps réel.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
