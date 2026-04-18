import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Coelor — An independent software studio",
  description:
    "Coelor is a small, senior studio building custom software, AI systems, and infrastructure for companies that refuse off-the-shelf answers.",
  metadataBase: new URL("https://coelor.com"),
  icons: {
    icon: [
      { url: "/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "Coelor — An independent software studio",
    description: "Custom software, AI systems, and infrastructure.",
    url: "https://coelor.com",
    siteName: "Coelor",
    images: [{ url: "/logo-dark-on-light.png", width: 1200, height: 300 }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${playfair.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
