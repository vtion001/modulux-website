"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const pathname = usePathname()

  const menuItems = [
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
  ]

  const closeMenu = () => {
    setIsOpen(false)
    setIsProductsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-foreground hover:text-primary transition-colors duration-200"
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[90vw] bg-background border-l border-border/40 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <img
            src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png"
            alt="ModuLux Logo"
            className="h-8 w-auto"
          />
          <button
            onClick={closeMenu}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Close mobile menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-full pb-20">
          {menuItems.map((item) => (
            <div key={item.name}>
              {item.hasDropdown ? (
                <div>
                  <button
                    onClick={() => setIsProductsOpen(!isProductsOpen)}
                    className="flex items-center justify-between w-full p-3 text-left text-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors duration-200"
                    aria-expanded={isProductsOpen}
                  >
                    <span className="font-medium">{item.name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isProductsOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isProductsOpen && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          onClick={closeMenu}
                          className={`block p-2 text-sm rounded-md transition-colors duration-200 ${
                            pathname === dropdownItem.href
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className={`block p-3 rounded-md font-medium transition-colors duration-200 ${
                    pathname === item.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground hover:text-primary hover:bg-muted/50"
                  }`}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-border/40 mt-6">
            <Link
              href="/contact"
              onClick={closeMenu}
              className="block w-full bg-primary text-white text-center py-3 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors duration-200"
            >
              Get Quote
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
