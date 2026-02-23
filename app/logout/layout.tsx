import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Déconnexion | Vibe Control",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LogoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
