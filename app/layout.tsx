import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import content from "@/data/site-content.json";
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

export const metadata: Metadata = {
  title: content.seo.title,
  description: content.seo.description,
  metadataBase: new URL("https://coelor.com"),
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
    url: "https://coelor.com",
    siteName: content.brand.name,
    images: [{ url: "/logo-white-on-dark.png", width: 1200, height: 400 }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0C10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
