import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suryansh Pandey — Backend & AI Engineer",
  description:
    "Ask me anything. An AI version of Suryansh (Surya) Pandey answers questions about his projects, skills and experience.",
  openGraph: {
    title: "Suryansh Pandey — ask me anything",
    description: "An interactive portfolio: ask a question and an AI answers from my real projects and experience.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
