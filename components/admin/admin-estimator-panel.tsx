"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { EstimatorCalculator } from "@/components/admin/estimator-calculator"

export function AdminEstimatorPanel(): JSX.Element | null {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("admin:open-estimator", onOpen as any)
    return () => window.removeEventListener("admin:open-estimator", onOpen as any)
  }, [])

  if (!open) return null

  return (
    <section id="admin-estimator-panel" className="mb-6 relative z-0">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Calculator</div>
        <button
          type="button"
          aria-label="Close calculator"
          onClick={() => {
            setOpen(false)
            window.dispatchEvent(new CustomEvent("admin:close-estimator"))
          }}
          className="px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          Close
        </button>
      </div>
      <EstimatorCalculator />
    </section>
  )
}
