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

  const handleConfirmed = () => {
    setShowConfirm(false)
    if (buttonRef.current?.form) {
      const form = buttonRef.current.form
      // We set a flag to allow the next click to go through
      const originalSubmit = (form as any)._isConfirmedBySubmitButton
        ; (form as any)._isConfirmedBySubmitButton = true

      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit()
      } else {
        // Fallback for very old browsers: just click the button manually
        // but avoid recursion by checking the flag
        buttonRef.current.click()
      }

      // Reset flag after a tick
      setTimeout(() => {
        ; (form as any)._isConfirmedBySubmitButton = false
      }, 100)
    }
  }

  const handleInitialClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // If we've already confirmed, let the event through
    const form = e.currentTarget.form as any
    if (form?._isConfirmedBySubmitButton) {
      return
    }

    if (confirm) {
      e.preventDefault()
      e.stopPropagation()
      setShowConfirm(true)
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
