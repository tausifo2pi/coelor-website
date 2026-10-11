import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import content from "@/data/site-content.json";
import Tracker from "@/components/Tracker";
import { OG_IMAGE, SITE_URL, jsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

// Defaults for every page. A page that sets its own `openGraph` replaces this whole block (lib/seo.ts openGraph() keeps
// the image and locale in it). No og:url here, so a page without its own block does not claim the homepage's address.
export const metadata: Metadata = {
  title: content.seo.title,
  description: content.seo.description,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: content.seo.openGraphTitle,
    description: content.seo.openGraphDescription,
    siteName: content.brand.name,
    locale: "en_US",
    images: [OG_IMAGE],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0A0C10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning>
        {/* Who we are, for search engines (Organization + WebSite). The /pricing Service is lib/seo.ts serviceJsonLd(). */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([organizationJsonLd(), websiteJsonLd()]) }} />
        {children}
        <Tracker />
      </body>
    </html>
  );
}
