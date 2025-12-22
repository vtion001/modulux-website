"use client"
import * as React from "react"
import { toast } from "sonner"
import { useFormStatus } from "react-dom"
import { ConfirmationModal } from "./confirmation-modal"

function FormWatcher({ onSubmitted, successMessage }: any) {
  const { pending } = useFormStatus()
  const wasPending = React.useRef(false)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    if (pending) {
      wasPending.current = true
      setSaved(false)
    } else if (wasPending.current) {
      wasPending.current = false
      setSaved(true)
      if (typeof onSubmitted === "function") {
        try { onSubmitted() } catch { }
      } else if (typeof window !== "undefined") {
        try { window.dispatchEvent(new CustomEvent("modal:close")) } catch { }
      }
      try { if (successMessage) toast.success(String(successMessage)) } catch { }
    }
  }, [pending, onSubmitted, successMessage])

  return (
    <div className="text-xs text-muted-foreground mb-1">
      {pending ? "Saving..." : (saved ? "Saved" : null)}
    </div>
  )
}

export const SaveForm: any = ({ action, children, className, onSubmitted, successMessage }: any) => {
  return (
    <form action={action as any} className={className}>
      <FormWatcher onSubmitted={onSubmitted} successMessage={successMessage} />
      {children}
    </form>
  )
}

export const SubmitButton: any = ({ children, className, confirm, type = "primary" }: any) => {
  const [showConfirm, setShowConfirm] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const handleInitialClick = (e: React.MouseEvent) => {
    if (confirm) {
      e.preventDefault()
      e.stopPropagation()
      setShowConfirm(true)
    }
  }

  const handleConfirmed = () => {
    setShowConfirm(false)
    // Manually trigger form submission since we intercepted the initial click
    if (buttonRef.current?.form) {
      // Use form.requestSubmit() if available, fallback to form.submit()
      if (typeof buttonRef.current.form.requestSubmit === 'function') {
        buttonRef.current.form.requestSubmit()
      } else {
        buttonRef.current.form.submit()
      }
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="submit"
        className={className}
        onClick={handleInitialClick}
      >
        {children}
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmed}
        message={String(confirm)}
        type={type}
        title="Confirmation Required"
      />
    </>
  )
}
