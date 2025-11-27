"use client"
import { useTransition } from "react"

type Colors = Record<string, string>

type Post = {
  id: string
  time?: string
  status?: string
  content: string
  platforms?: string[]
  channel?: string
}

type Day = {
  key: string
  dayName: string
  dayNum: number
  items: Post[]
  inMonth: boolean
}

export default function MonthDnd({
  weeks,
  onReschedule,
  statusColors,
  platformColors,
  channelColors,
}: {
  weeks: Day[][]
  onReschedule: (prev: any, formData: FormData) => Promise<any>
  statusColors: Colors
  platformColors: Colors
  channelColors: Colors
}) {
  const [isPending, startTransition] = useTransition()

  function handleDrop(dayKey: string, id: string) {
    const fd = new FormData()
    fd.set("id", id)
    fd.set("schedule", `${dayKey} 09:00`)
    startTransition(() => {
      onReschedule(undefined, fd).then(() => {
        try { window.location.reload() } catch {}
      })
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3" aria-label="Month calendar">
      {weeks.map((week, wi) => (
        <div key={wi} className="space-y-3">
          {week.map((d) => (
            <div
              key={d.key}
              className={`bg-card border border-border/40 rounded-lg p-3 shadow-sm ${d.inMonth ? '' : 'opacity-60'} min-h-[200px]`}
              role="gridcell"
              aria-label={`${d.dayName} ${d.dayNum}`}
              tabIndex={0}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain")
                if (id) handleDrop(d.key, id)
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-foreground">{d.dayName}</div>
                <div className="text-xs text-muted-foreground">{d.dayNum}</div>
              </div>
              <div className="space-y-1">
                {d.items.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No posts</div>
                ) : (
                  d.items.slice(0,3).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-md border border-border/40 p-2 bg-background transition-colors hover:bg-muted"
                      draggable
                      onDragStart={(e) => { try { e.dataTransfer.setData("text/plain", p.id) } catch {} }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{p.time || ''}</div>
                        <span className={`inline-block w-2 h-2 rounded-full ${statusColors[(p.status || "").toString()] || 'bg-gray-300'}`}></span>
                      </div>
                      <div className="mt-1 text-xs text-foreground line-clamp-2">{p.content}</div>
                    </div>
                  ))
                )}
                {d.items.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{d.items.length - 3} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
      {isPending && (
        <div className="col-span-full text-center text-xs text-muted-foreground">Rescheduling...</div>
      )}
    </div>
  )
}
