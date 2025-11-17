import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://x402ugc.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "x402UGC - AI-Powered UGC Video Generator",
    template: "%s | x402UGC",
  },
  description:
    "Make AI-made UGC video based on a topic using x402. The user types in a topic they want to make content on, the agent searches the web, creates a script based on its findings and generates the content using x402 to call and uses the tools and services it needs to complete the task.",
  keywords: [
    "AI video generation",
    "UGC content",
    "x402 micropayments",
    "AI agent",
    "video creation",
    "content generation",
    "automated video",
  ],
  authors: [{ name: "x402UGC" }],
  creator: "x402UGC",
  publisher: "x402UGC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "x402UGC",
    title: "x402UGC - AI-Powered UGC Video Generator",
    description:
      "Make AI-made UGC video based on a topic using x402. The user types in a topic they want to make content on, the agent searches the web, creates a script based on its findings and generates the content using x402 to call and uses the tools and services it needs to complete the task.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "x402UGC - AI-Powered UGC Video Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "x402UGC - AI-Powered UGC Video Generator",
    description:
      "Make AI-made UGC video based on a topic using x402. The user types in a topic they want to make content on, the agent searches the web, creates a script based on its findings and generates the content using x402 to call and uses the tools and services it needs to complete the task.",
    images: ["/og.png"],
    creator: "@x402UGC",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes here if needed
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
