"use client"
import React from "react"

export type MessageBubbleProps = {
  from: "agent" | "client"
  text: string
  time?: string
}

export function MessageBubble({ from, text, time }: MessageBubbleProps) {
  const isAgent = from === "agent"
  return (
    <div
      className={`max-w-lg ${isAgent ? "ml-auto" : "mr-auto"} group`}
      role="article"
      aria-label={isAgent ? "Sent message" : "Received message"}
      tabIndex={0}
    >
      <div
        className={`rounded-2xl px-3 py-2 text-sm shadow-sm transition-colors ${
          isAgent
            ? "bg-emerald-500 text-white group-hover:bg-emerald-600"
            : "bg-muted text-foreground group-hover:bg-muted/70"
        }`}
      >
        {text}
      </div>
      {time ? (
        <div className="mt-1 text-[11px] text-muted-foreground text-right" aria-hidden="true">
          {time}
        </div>
      ) : null}
    </div>
  )
}

export default MessageBubble
