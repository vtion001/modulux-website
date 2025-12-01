"use client"
import * as React from "react"

export const SaveForm: any = ({ action, children, className }: any) => {
  return (
    <form action={action as any} className={className}>{children}</form>
  )
}

export const SubmitButton: any = ({ children, className, confirm }: any) => {
  const onClick = (e: any) => {
    if (confirm && typeof window !== "undefined") {
      const ok = window.confirm(String(confirm))
      if (!ok) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }
  return (
    <button type="submit" className={className} onClick={onClick}>
      {children}
    </button>
  )
}
