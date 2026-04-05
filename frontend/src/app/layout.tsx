import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIGadget - AI-Powered Gadget Reviews & Recommendations",
  description:
    "Find the perfect gadget with AI-powered recommendations, real-time price comparisons, and synthesized reviews from thousands of sources.",
  keywords: [
    "gadget reviews",
    "product comparison",
    "AI recommendations",
    "best smartphones",
    "tech reviews",
    "price comparison",
  ],
  openGraph: {
    title: "AIGadget - AI-Powered Gadget Reviews & Recommendations",
    description: "Find the perfect gadget with AI-powered recommendations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
