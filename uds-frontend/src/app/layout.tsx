import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

// Raleway is the live site's :root face. Self-hosted so builds and page loads
// never depend on a third-party font request.
const raleway = localFont({
  src: "./fonts/Raleway-Variable.woff2",
  weight: "400 700",
  variable: "--font-raleway",
  display: "swap",
});

// The live site specifies Gellix for display type but never serves the font file
// (so it falls back to Arial in practice). Outfit is the closest freely licensed
// geometric sans to the intended treatment.
const outfit = localFont({
  src: "./fonts/Outfit-Variable.woff2",
  weight: "500 800",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unilag Design Studio - Innovation Hub",
  description:
    "UNILAG Design Studio platform: innovation showcase and smart inventory management system for tracking components and equipment",
  authors: [{ name: "UNILAG Design Studio" }],
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
