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
    <div ref={ref} className="overflow-auto px-6 py-4 space-y-3 scroll-smooth" role="log" aria-live="polite">
      {messages.map((m, i) => (
        <MessageBubble key={i} from={m.from} text={m.text} time={m.time} />
      ))}
      {messages.length === 0 && (
        <div className="text-sm text-muted-foreground">No messages yet</div>
      )}
    </div>
  )
}

export default MessageLog
