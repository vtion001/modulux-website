import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { ConditionalHeader } from "@/components/conditional-header"
import { Footer } from "@/components/footer"
import { LoadingSpinner } from "@/components/loading-spinner"
import { FloatingContact } from "@/components/floating-contact"
import { LiveChat } from "@/components/live-chat"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Breadcrumb } from "@/components/breadcrumb"
import { AccessibilitySkipLink } from "@/components/accessibility-skip-link"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "ModuLux - Luxury Modular Cabinets | Premium Home Solutions",
  description:
    "Discover ModuLux premium modular cabinets. Where modern meets timeless. Luxury in every detail. Serving all of the Philippines from Bulacan.",
  generator: "v0.app",
  keywords:
    "modular cabinets, luxury cabinets, kitchen cabinets, wardrobes, bathroom vanities, walk-in closets, bespoke furniture, Philippines, Bulacan, premium furniture, custom cabinets",
  authors: [{ name: "ModuLux" }],
  creator: "ModuLux",
  publisher: "ModuLux",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://modulux.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ModuLux - Luxury Modular Cabinets | Premium Home Solutions",
    description: "Discover ModuLux premium modular cabinets. Where modern meets timeless. Luxury in every detail.",
    url: "https://modulux.com",
    siteName: "ModuLux",
    images: [
      {
        url: "https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png",
        width: 1200,
        height: 630,
        alt: "ModuLux - Premium Modular Cabinets",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModuLux - Luxury Modular Cabinets",
    description: "Discover ModuLux premium modular cabinets. Where modern meets timeless.",
    images: ["https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"],
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth light" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ModuLux",
              description:
                "Premium modular cabinet manufacturer specializing in luxury kitchen cabinets, wardrobes, and bespoke furniture.",
              url: "https://modulux.com",
              logo: "https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+63-917-133-8888",
                contactType: "customer service",
                areaServed: "PH",
                availableLanguage: "English",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "PH",
                addressRegion: "Bulacan",
              },
              sameAs: ["https://www.facebook.com/modulux", "https://www.instagram.com/modulux"],
            }),
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          <AccessibilitySkipLink />
          <ConditionalHeader />
          <Breadcrumb />
          <main id="main-content" role="main">
            <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
          </main>
          <Footer />
          <FloatingContact />
          <LiveChat />
          <ScrollToTop />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
