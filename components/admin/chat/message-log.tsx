"use client"
import * as React from "react"
import { MessageBubble } from "@/components/admin/chat/message-bubble"

export type Message = { from: "agent" | "client"; text: string; time?: string }

export function MessageLog({ messages }: { messages: Message[] }): React.ReactElement {
  const ref = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <div ref={ref} className="overflow-auto px-3 md:px-6 py-4 space-y-3 scroll-smooth bg-gradient-to-b from-white to-muted/30" role="log" aria-live="polite">
      {messages.map((m, i) => (
        <MessageBubble key={i} from={m.from} text={m.text} time={m.time} />
      ))}
      {messages.length === 0 && (
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-4 w-1/3 rounded bg-muted" />
          </div>
          <div className="animate-pulse">
            <div className="h-4 w-2/5 rounded bg-muted ml-auto" />
          </div>
          <div className="animate-pulse">
            <div className="h-4 w-1/4 rounded bg-muted" />
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageLog
