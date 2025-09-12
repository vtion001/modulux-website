"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { SearchModal } from "./search-modal"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSelector } from "./language-selector"
import { MobileMenu } from "./mobile-menu"

export function Header() {
  const pathname = usePathname()
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="hover:scale-105 transition-transform duration-200">
            <Link href="/" aria-label="ModuLux Home">
              <img
                src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"
                alt="ModuLux Logo"
                className="h-10 w-auto"
              />
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Main navigation">
            {[
              { name: "Home", href: "/" },
              {
                name: "Products",
                href: "/products",
                hasDropdown: true,
                dropdownItems: [
                  { name: "Kitchen Cabinets", href: "/products/kitchen-cabinets" },
                  { name: "Wardrobes", href: "/products/wardrobes" },
                  { name: "Bathroom Vanities", href: "/products/bathroom-vanities" },
                  { name: "Walk-in Closets", href: "/products/walk-in-closets" },
                  { name: "Bespoke Furniture", href: "/products/bespoke-furniture" },
                ],
              },
              { name: "Services", href: "/services" },
              { name: "Projects", href: "/projects" },
              { name: "About", href: "/about" },
              { name: "Blog", href: "/blog" },
              { name: "Calculator", href: "/calculator" },
              { name: "Contact", href: "/contact" },
            ].map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setIsProductsOpen(true)}
                onMouseLeave={() => item.hasDropdown && setIsProductsOpen(false)}
              >
                <Link
                  href={item.href}
                  className={`text-foreground hover:text-primary transition-colors relative group flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:rounded-md px-2 py-1 ${
                    pathname === item.href || (item.hasDropdown && pathname.startsWith("/products"))
                      ? "text-primary"
                      : ""
                  }`}
                  aria-current={pathname === item.href ? "page" : undefined}
                  aria-expanded={item.hasDropdown ? isProductsOpen : undefined}
                  aria-haspopup={item.hasDropdown ? "menu" : undefined}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <svg
                      className={`w-4 h-4 transition-transform ${isProductsOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <div
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      pathname === item.href || (item.hasDropdown && pathname.startsWith("/products"))
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                    aria-hidden="true"
                  />
                </Link>

                {item.hasDropdown && (
                  <div
                    className={`absolute top-full left-0 mt-2 w-56 bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
                      isProductsOpen ? "opacity-100 visible" : "opacity-0 invisible"
                    }`}
                    role="menu"
                    aria-label="Products submenu"
                  >
                    {item.dropdownItems?.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.name}
                        href={dropdownItem.href}
                        className="block px-4 py-3 text-sm text-foreground hover:text-primary hover:bg-primary/5 transition-colors border-b border-border/30 last:border-b-0 focus:outline-none focus:bg-primary/5 focus:text-primary"
                        role="menuitem"
                      >
                        {dropdownItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector />
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Open search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <Link
              href="/contact"
              className="hidden sm:inline-flex bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
            >
              Get Quote
            </Link>

            <MobileMenu />
          </div>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
