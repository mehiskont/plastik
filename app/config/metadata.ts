import type { Metadata } from "next"

const baseMetadata: Metadata = {
  title: {
    default: "Plastik Record Store",
    template: "%s | Plastik Record Store",
  },
  description: "Find and buy rare vinyl records from our curated collection.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://plastik-record-store.vercel.app",
    siteName: "Plastik Record Store",
  },
  twitter: {
    card: "summary_large_image",
    site: "@plastikrecords",
    creator: "@plastikrecords",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export default baseMetadata

