"use client"
import * as React from "react"

export const SaveForm: any = ({ action, children, className }: any) => {
  return (
    <form action={action as any} className={className}>{children}</form>
  )
}

export const SubmitButton: any = ({ children, className }: any) => {
  return (
    <button type="submit" className={className}>{children}</button>
  )
}
