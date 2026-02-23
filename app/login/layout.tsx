import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | Vibe Control",
  description:
    "Connectez-vous à Vibe Control pour gérer vos sessions musicales collaboratives.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
