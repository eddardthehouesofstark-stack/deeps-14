import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "deeps — your caring AI companion",
  description: "A personal AI companion for thoughtful conversations and decision support."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
