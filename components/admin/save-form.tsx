"use client"
import * as React from "react"
import { useFormStatus } from "react-dom"

export const SaveForm: any = ({ action, children, className }: any) => {
  return (
    <form action={action as any} className={className}>{children}</form>
  )
}

export const SubmitButton: any = ({ children, className }: any) => {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      data-pending={pending ? "true" : "false"}
    >
      {children}
    </button>
  )
}
