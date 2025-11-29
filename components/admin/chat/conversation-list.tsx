"use client"
import * as React from "react"
import { CheckCheck, Circle } from "lucide-react"

export type ConversationListItem = {
  id: string
  client: string
  platform: string
  status: string
}

export function ConversationList({ items, selectedId }: { items: ConversationListItem[]; selectedId?: string }): React.ReactElement {
  const containerRef = React.useRef<HTMLUListElement | null>(null)
  const [active, setActive] = React.useState<string | undefined>(selectedId)

  React.useEffect(() => setActive(selectedId), [selectedId])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = containerRef.current
    if (!el) return
    const nodes = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[data-id]'))
    const idx = nodes.findIndex(n => n.dataset.id === active)
    if (e.key === 'ArrowDown') {
      const next = nodes[Math.min(idx + 1, nodes.length - 1)] || nodes[0]
      next?.focus()
      setActive(next?.dataset.id)
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      const prev = nodes[Math.max(idx - 1, 0)] || nodes[nodes.length - 1]
      prev?.focus()
      setActive(prev?.dataset.id)
      e.preventDefault()
    } else if (e.key === 'Home') {
      const first = nodes[0]
      first?.focus()
      setActive(first?.dataset.id)
      e.preventDefault()
    } else if (e.key === 'End') {
      const last = nodes[nodes.length - 1]
      last?.focus()
      setActive(last?.dataset.id)
      e.preventDefault()
    }
  }

  return (
    <ul
      ref={containerRef}
      className="overflow-auto h-[calc(100%-80px)] bg-white"
      role="listbox"
      aria-label="Conversation list"
      aria-activedescendant={active}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {items.map((c) => (
        <li key={c.id} role="option" aria-selected={c.id === selectedId}>
          <a
            href={`/admin/conversations?id=${encodeURIComponent(c.id)}`}
            data-id={c.id}
            className={`flex items-center gap-3 px-4 py-3 border-b border-border/40 transition-all hover:bg-muted/60 hover:translate-x-0.5 ${c.id === selectedId ? 'bg-muted' : 'bg-white'}`}
          >
            <span className="w-8 h-8 rounded-full bg-accent/20 border border-border/40" aria-hidden="true"></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-foreground truncate">{c.client}</div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap">10:35 AM</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                <span className="truncate">{c.platform}</span>
                <span aria-hidden="true">•</span>
                <span className="truncate">{c.status}</span>
                <span className="ml-auto inline-flex items-center gap-1 text-primary">
                  <CheckCheck className="w-3 h-3" aria-hidden="true" />
                  <Circle className="w-2 h-2" aria-hidden="true" />
                </span>
              </div>
            </div>
          </a>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-4 py-6 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div>No conversations yet</div>
            <a href="/admin/social" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-foreground hover:bg-muted/70">Connect channels</a>
          </div>
        </li>
      )}
    </ul>
  )
}

export default ConversationList
