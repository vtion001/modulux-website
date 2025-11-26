"use client"

import { useEffect, useState } from "react"

export function EstimatorNavButton() {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const onOpen = () => setExpanded(true)
    const onClose = () => setExpanded(false)
    window.addEventListener("admin:open-estimator", onOpen as any)
    window.addEventListener("admin:close-estimator", onClose as any)
    return () => {
      window.removeEventListener("admin:open-estimator", onOpen as any)
      window.removeEventListener("admin:close-estimator", onClose as any)
    }
  }, [])

  return (
    <button
      type="button"
      aria-label="Open calculator"
      aria-controls="admin-estimator-panel"
      aria-expanded={expanded}
      onClick={() => window.dispatchEvent(new CustomEvent("admin:open-estimator"))}
      className="px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      Calculator
    </button>
  )
}
