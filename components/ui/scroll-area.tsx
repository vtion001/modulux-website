"use client"

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import type React from "react"
import { cn } from "@/lib/utils"

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  viewportRef?: React.Ref<HTMLDivElement>
}

export function ScrollArea({ className, children, viewportRef, ...props }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full" style={{ overflowY: "auto" }}>
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="side-panel-radix-scrollbar">
        <ScrollAreaPrimitive.Thumb className="side-panel-radix-thumb" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  )
}

export const ScrollAreaViewport = ScrollAreaPrimitive.Viewport
export const Scrollbar = ScrollAreaPrimitive.Scrollbar
export const ScrollbarThumb = ScrollAreaPrimitive.Thumb
export const ScrollAreaCorner = ScrollAreaPrimitive.Corner
