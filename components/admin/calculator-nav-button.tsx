"use client"

export function CalculatorNavButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("admin:open-calculator"))}
      className="px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]"
    >
      Calculator
    </button>
  )
}

