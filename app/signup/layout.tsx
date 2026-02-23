import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription | Vibe Control",
  description:
    "Créez votre compte Vibe Control pour lancer des playlists collaboratives et garder le contrôle de la musique.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
