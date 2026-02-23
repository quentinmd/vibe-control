import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Host | Vibe Control",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
