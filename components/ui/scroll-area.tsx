"use client"

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import type React from "react"
import { cn } from "@/lib/utils"

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full">
        {children}
      </ScrollAreaPrimitive.Viewport>
    </ScrollAreaPrimitive.Root>
  )
}

export const ScrollAreaViewport = ScrollAreaPrimitive.Viewport
export const Scrollbar = ScrollAreaPrimitive.Scrollbar
export const ScrollbarThumb = ScrollAreaPrimitive.Thumb
export const ScrollAreaCorner = ScrollAreaPrimitive.Corner

