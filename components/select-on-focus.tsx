"use client"
import * as React from "react"

export function SelectOnFocusInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { onFocus, ...rest } = props
  return (
    <input
      {...rest}
      onFocus={(e) => {
        onFocus?.(e)
        // Delay select to allow focus to settle
        setTimeout(() => {
          try {
            e.currentTarget.select()
          } catch {}
        }, 0)
      }}
    />
  )
}

export function SelectOnFocusTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { onFocus, ...rest } = props
  return (
    <textarea
      {...rest}
      onFocus={(e) => {
        onFocus?.(e)
        setTimeout(() => {
          try {
            e.currentTarget.select()
          } catch {}
        }, 0)
      }}
    />
  )
}