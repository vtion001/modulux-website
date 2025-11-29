"use client"
import React from "react"

export type MessageBubbleProps = {
  from: "agent" | "client"
  text: string
  time?: string
  type?: "text" | "system" | "image" | "link"
  status?: "sending" | "sent" | "delivered" | "read"
}

export function MessageBubble({ from, text, time, type = "text", status }: MessageBubbleProps) {
  const isAgent = from === "agent"
  const bubbleBase = "rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 transition-all duration-200"
  const bubbleColors = isAgent
    ? "bg-gradient-to-br from-primary to-primary/90 text-white ring-black/10"
    : "bg-white text-foreground ring-black/5"
  const alignment = isAgent ? "ml-auto" : "mr-auto"
  const entryAnim = isAgent ? "animate-in fade-in slide-in-from-right-1" : "animate-in fade-in slide-in-from-left-1"

  return (
    <div
      className={`max-w-lg ${alignment} group ${entryAnim}`}
      role={type === "system" ? "note" : "article"}
      aria-label={isAgent ? "Sent message" : "Received message"}
      tabIndex={0}
    >
      <div
        className={`${bubbleBase} ${bubbleColors} group-hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30`}
      >
        {text}
      </div>
      <div className={`mt-1 text-[11px] ${isAgent ? "text-white/80" : "text-muted-foreground"} ${isAgent ? "text-right" : "text-left"}`} aria-hidden="true">
        {time ? time : ""}{status ? ` • ${status === "sending" ? "Sending…" : status === "sent" ? "Sent" : status === "delivered" ? "Delivered" : status === "read" ? "Read" : ""}` : ""}
      </div>
    </div>
  )
}

export default MessageBubble
