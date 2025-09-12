"use client"

import { useState } from "react"
import Link from "next/link"

export function FloatingContact() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end space-y-3">
        {isExpanded && (
          <div className="flex flex-col space-y-2 animate-in slide-in-from-bottom-2 duration-200">
            <Link
              href="/contact"
              className="bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors duration-200 border border-primary/20"
            >
              Get Quote
            </Link>
            <a
              href="tel:+639171338888"
              className="bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors duration-200 border border-primary/20"
            >
              Call Now
            </a>
            <a
              href="mailto:info@modulux.com"
              className="bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors duration-200 border border-primary/20"
            >
              Email Us
            </a>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          aria-label="Contact options"
        >
          <svg
            className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? "rotate-45" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
