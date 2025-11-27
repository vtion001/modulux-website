"use client"
import { useMemo, useRef, useState, useTransition, useEffect } from "react"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"

type Colors = Record<string, string>

export default function ListBulk({
  posts,
  statusColors,
  platformColors,
  channelColors,
  deletePosts,
  bulkReschedule,
}: {
  posts: any[]
  statusColors: Colors
  platformColors: Colors
  channelColors: Colors
  deletePosts: (prev: any, formData: FormData) => Promise<any>
  bulkReschedule: (prev: any, formData: FormData) => Promise<any>
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [schedule, setSchedule] = useState("")
  const [isPending, startTransition] = useTransition()
  const ids = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(480)
  const rowHeight = 72
  const totalHeight = posts.length * rowHeight
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + 8
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight))
  const endIndex = Math.min(posts.length, startIndex + visibleCount)
  const visiblePosts = posts.slice(startIndex, endIndex)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onResize = () => setViewportHeight(el.clientHeight || 480)
    onResize()
    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener("scroll", onScroll)
    window.addEventListener("resize", onResize)
    return () => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  function toggleAll() {
    if (ids.length === posts.length) {
      setSelected({})
    } else {
      const next: Record<string, boolean> = {}
      for (const p of posts) next[p.id] = true
      setSelected(next)
    }
  }

  return (
    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted-foreground">Selected: {ids.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="px-2 py-1 rounded-md bg-card border border-border/40 text-xs">Toggle All</button>
          <SaveForm action={deletePosts} className="inline-flex items-center gap-2">
            {ids.map((id) => (<input key={id} type="hidden" name="ids" value={id} />))}
            <SubmitButton className="px-2 py-1 rounded-md bg-card border border-border/40 text-xs">Delete Selected</SubmitButton>
          </SaveForm>
          <SaveForm action={bulkReschedule} className="inline-flex items-center gap-2">
            <input type="text" name="schedule" value={schedule} onChange={(e)=>setSchedule(e.target.value)} placeholder="Reschedule..." className="px-2 py-1 border border-border/40 rounded text-xs bg-background" />
            {ids.map((id) => (<input key={id} type="hidden" name="ids" value={id} />))}
            <SubmitButton className="px-2 py-1 rounded-md bg-card border border-border/40 text-xs">Apply</SubmitButton>
          </SaveForm>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-xs font-medium text-muted-foreground mb-2">
        <div className="inline-flex items-center gap-2"><input type="checkbox" checked={ids.length===posts.length && posts.length>0} onChange={toggleAll} /> Time</div>
        <div>Channel</div>
        <div className="md:col-span-2">Content</div>
        <div>Platforms</div>
        <div>Status</div>
      </div>

      {posts.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start p-2 border border-border/40 rounded-md bg-background animate-pulse">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="md:col-span-2 h-4 w-full bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="relative overflow-y-auto border border-border/40 rounded-md bg-background" style={{ height: viewportHeight }}>
          <div style={{ height: totalHeight }}>
            <div style={{ transform: `translateY(${startIndex * rowHeight}px)` }} className="space-y-2">
              {visiblePosts.map((p) => (
                <div key={p.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start text-sm p-2 border border-border/40 rounded-md bg-background">
                  <div className="inline-flex items-center gap-2"><input type="checkbox" checked={!!selected[p.id]} onChange={(e)=>setSelected((s)=>({ ...s, [p.id]: e.target.checked }))} /> <span className="text-muted-foreground">{p.time || ''}</span></div>
                  <div><span className={`inline-flex px-2 py-0.5 rounded text-xs text-white ${channelColors[(p.channel || '').toString()] || 'bg-gray-500'}`}>{p.channel || 'channel'}</span></div>
                  <div className="md:col-span-2 text-foreground line-clamp-2">{p.content}</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(Array.isArray(p.platforms) ? p.platforms : []).map((plat: string) => (
                      <span key={plat} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${platformColors[plat] || 'bg-gray-500'}`}>{plat}</span>
                    ))}
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${statusColors[(p.status || '').toString()] || 'bg-gray-300'}`}></span>
                    <span className="text-muted-foreground capitalize">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isPending && (<div className="text-center text-xs text-muted-foreground mt-2">Processing...</div>)}
    </div>
  )
}
