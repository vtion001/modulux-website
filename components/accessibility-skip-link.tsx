export function AccessibilitySkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      Skip to main content
    </a>
  )
}
