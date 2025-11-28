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
  media_url?: string
  link_url?: string
}

type Day = {
  key: string
  dayName: string
  dayNum: number
  items: Post[]
}

export default function WeekDnd({
  days,
  onReschedule,
  statusColors,
  platformColors,
  channelColors,
}: {
  days: Day[]
  onReschedule: (prev: any, formData: FormData) => Promise<any>
  statusColors: Colors
  platformColors: Colors
  channelColors: Colors
}) {
  const [isPending, startTransition] = useTransition()

  function handleDrop(dayKey: string, id: string) {
    const post = days.flatMap(d => d.items).find(p => p.id === id)
    const time = post?.time || "09:00"
    const fd = new FormData()
    fd.set("id", id)
    fd.set("schedule", `${dayKey} ${time}`)
    startTransition(() => {
      onReschedule(undefined, fd).then(() => {
        try { window.location.reload() } catch {}
      })
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 animate-in fade-in" role="grid" aria-label="Weekly planner">
      {days.map((d) => (
        <div
          key={d.key}
          className="bg-card border border-border/40 rounded-lg p-3 shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-primary/20 animate-in slide-in-from-bottom-1 flex flex-col h-[220px] sm:h-[240px] lg:h-[260px]"
          role="gridcell"
          aria-label={`${d.dayName} ${d.dayNum}`}
          tabIndex={0}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const id = e.dataTransfer.getData("text/plain")
            if (id) handleDrop(d.key, id)
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-foreground">{d.dayName}</div>
            <div className="text-xs text-muted-foreground">{d.dayNum}</div>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {d.items.length === 0 ? (
              <div className="text-xs text-muted-foreground">No posts</div>
            ) : (
              d.items.map((p) => (
                <div
                  key={p.id}
                  className="rounded-md border border-border/40 p-2 bg-background/70 backdrop-blur transition-all hover:bg-muted"
                  draggable
                  onDragStart={(e) => {
                    try { e.dataTransfer.setData("text/plain", p.id) } catch {}
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{p.time || ""}</div>
                    <span className={`inline-block w-2 h-2 rounded-full ${statusColors[(p.status || "").toString()] || 'bg-gray-300'}`}></span>
                  </div>
                  <div className="mt-1 text-sm text-foreground line-clamp-2">{p.content}</div>
                  {(p.media_url || p.link_url) && (
                    <div className="mt-1 flex items-center gap-2">
                      {p.media_url ? <img src={p.media_url} alt="media" className="h-12 w-12 object-cover rounded border border-border/40" /> : null}
                      {p.link_url ? (
                        <a href={p.link_url} target="_blank" rel="noreferrer" className="text-xs underline text-muted-foreground break-all">{p.link_url}</a>
                      ) : null}
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {(Array.isArray(p.platforms) ? p.platforms : []).map((plat: string) => (
                      <span key={plat} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${platformColors[plat] || 'bg-gray-500'}`}>{plat}</span>
                    ))}
                    <span className={`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${channelColors[(p.channel || "").toString()] || 'bg-gray-500'}`}>{p.channel || 'channel'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
      {isPending && (
        <div className="col-span-full text-center text-xs text-muted-foreground">Rescheduling...</div>
      )}
    </div>
  )
}
