"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Breadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)

  if (pathSegments.length === 0) return null

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      return { label, href }
    }),
  ]

  return (
    <nav className="bg-muted/30 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 text-sm">
          <div className="flex items-center space-x-2">
            {breadcrumbItems.map((item, index) => (
              <div key={item.href} className="flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-muted-foreground mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="text-foreground font-medium">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          {pathname.startsWith("/admin") && (
            <div className="flex items-center gap-2">
              <Link
                href="/proposal"
                className="inline-flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Business Proposal
              </Link>
              <Link
                href="/pitch-deck"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 hover:shadow-md transition-colors"
              >
                Pitch Deck
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
