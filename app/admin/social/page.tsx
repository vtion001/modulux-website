import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"
import { SocialQuickCompose } from "@/components/admin/social-quick-compose"
import SocialPreviewComposer from "@/components/admin/social-preview-composer"
import { ChevronLeft, ChevronRight, Settings } from "lucide-react"
import ListBulk from "@/components/admin/list-bulk"
import WeekDnd from "@/components/admin/week-dnd"
import MonthDnd from "@/components/admin/month-dnd"
import { supabaseServer } from "@/lib/supabase-server"

const postsPath = ""
//

// Helper function to get week dates
function getWeekDates(date: Date = new Date()) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
  start.setDate(diff)
  
  const dates = []
  for (let i = 0; i < 7; i++) {
    const current = new Date(start)
    current.setDate(start.getDate() + i)
    dates.push(current)
  }
  return dates
}

function getMonthMatrix(date: Date = new Date()) {
  const base = new Date(date)
  const year = base.getFullYear()
  const month = base.getMonth()
  const first = new Date(year, month, 1)
  const dow = first.getDay()
  const start = new Date(first)
  const diff = first.getDate() - dow + (dow === 0 ? -6 : 1)
  start.setDate(diff)
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const row: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + (w * 7) + i)
      row.push(d)
    }
    weeks.push(row)
  }
  return weeks
}

// Mock data for demonstration - in real implementation this would come from your data files
const mockChannels = [
  { id: "modulux", name: "ModuLux", color: "bg-purple-500" },
  { id: "modulux-design", name: "ModuLux Design", color: "bg-blue-500" },
  { id: "modulux-build", name: "ModuLux Build", color: "bg-green-500" },
  { id: "modulux-blog", name: "ModuLux Blog", color: "bg-orange-500" },
  { id: "newsletter", name: "Newsletter", color: "bg-yellow-500" },
]

const mockPosts = [
  {
    id: "1",
    content: "SJ: new flavour in town",
    platforms: ["newsletter"],
    schedule: "2025-02-03 17:34",
    status: "scheduled",
    channel: "newsletter",
    time: "17:34",
    metrics: { comments: 2, likes: 15 }
  },
  {
    id: "2",
    content: "In need of a boost? Try our new...",
    platforms: ["instagram"],
    schedule: "2025-02-03 20:41",
    status: "scheduled",
    channel: "modulux",
    time: "20:41",
    metrics: { comments: 2, likes: 8 }
  },
  {
    id: "3",
    content: "5 Benefits of Natural Lighting in Kitchen Design",
    platforms: ["blog"],
    schedule: "2025-02-04 10:00",
    status: "published",
    channel: "modulux-blog",
    time: "10:00",
    metrics: { comments: 5, likes: 25 }
  },
  {
    id: "4",
    content: "Yummy! Did you know...",
    platforms: ["instagram"],
    schedule: "2025-02-04 14:30",
    status: "scheduled",
    channel: "modulux",
    time: "14:30",
    metrics: { comments: 2, likes: 12 }
  },
  {
    id: "5",
    content: "Ready or not, new Jusco...",
    platforms: ["facebook"],
    schedule: "2025-02-04 16:15",
    status: "scheduled",
    channel: "modulux",
    time: "16:15",
    metrics: { comments: 3, likes: 18 }
  },
  {
    id: "6",
    content: "Never underestimate...",
    platforms: ["twitter"],
    schedule: "2025-02-04 18:45",
    status: "scheduled",
    channel: "modulux",
    time: "18:45",
    metrics: { comments: 1, likes: 7 }
  },
  {
    id: "7",
    content: "SJ: what soda are you into?",
    platforms: ["newsletter"],
    schedule: "2025-02-05 17:34",
    status: "scheduled",
    channel: "newsletter",
    time: "17:34",
    metrics: { comments: 2, likes: 9 }
  },
  {
    id: "8",
    content: "Greens, spice, and everything nice...",
    platforms: ["instagram"],
    schedule: "2025-02-05 19:20",
    status: "scheduled",
    channel: "modulux-build",
    time: "19:20",
    metrics: { comments: 6, likes: 24 }
  },
  {
    id: "9",
    content: "Start your day with a sparkling...",
    platforms: ["facebook"],
    schedule: "2025-02-06 11:15",
    status: "scheduled",
    channel: "modulux",
    time: "11:15",
    metrics: { comments: 2, likes: 11 }
  },
  {
    id: "10",
    content: "This is how a nutrient powerhouse...",
    platforms: ["instagram"],
    schedule: "2025-02-07 20:42",
    status: "scheduled",
    channel: "modulux",
    time: "20:42",
    metrics: { comments: 2, likes: 16 }
  },
  {
    id: "11",
    content: "Try out our new smooth...",
    platforms: ["facebook"],
    schedule: "2025-02-07 20:43",
    status: "scheduled",
    channel: "modulux-design",
    time: "20:43",
    metrics: { comments: 1, likes: 8 }
  },
  {
    id: "12",
    content: "Superfood that also looks...",
    platforms: ["instagram"],
    schedule: "2025-02-08 12:42",
    status: "scheduled",
    channel: "modulux",
    time: "12:42",
    metrics: { comments: 3, likes: 14 }
  },
  {
    id: "13",
    content: "What creative ingredients...",
    platforms: ["instagram", "facebook"],
    schedule: "2025-02-08 15:30",
    status: "scheduled",
    channel: "modulux-build",
    time: "15:30",
    metrics: { comments: 4, likes: 21 }
  },
  {
    id: "14",
    content: "10 smoothies you can make...",
    platforms: ["blog", "newsletter"],
    schedule: "2025-02-09 17:34",
    status: "scheduled",
    channel: "modulux-blog",
    time: "17:34",
    metrics: { comments: 5, likes: 19 }
  },
  {
    id: "15",
    content: "All smoothies are pretty...",
    platforms: ["instagram"],
    schedule: "2025-02-09 20:42",
    status: "scheduled",
    channel: "modulux",
    time: "20:42",
    metrics: { comments: 2, likes: 13 }
  }
]

// Color mapping for platforms - matching photo colors
const platformColors = {
  facebook: "bg-[#1877F2]",
  instagram: "bg-gradient-to-r from-[#F58529] to-[#DD2A7B]",
  twitter: "bg-[#1DA1F2]",
  linkedin: "bg-[#0A66C2]",
  blog: "bg-[#10B981]",
  newsletter: "bg-[#F59E0B]"
}

// Status indicator colors
const statusColors = {
  published: "bg-green-500",
  scheduled: "bg-orange-500",
  draft: "bg-gray-400"
}

// Channel colors matching the photo
const channelColors = {
  "modulux": "bg-purple-500",
  "modulux-design": "bg-blue-500", 
  "modulux-build": "bg-green-500",
  "modulux-blog": "bg-orange-500",
  "newsletter": "bg-yellow-500"
}

async function addPost(prev: any, formData: FormData) {
  "use server"
  const content = String(formData.get("content") || "").trim()
  const platforms = formData.getAll("platforms").map((v) => String(v || "")).filter(Boolean)
  const schedule = String(formData.get("schedule") || "").trim()
  const channels = formData.getAll("channels").map((v) => String(v || "")).filter(Boolean)
  const channel = channels[0] || ""
  const media_url = String(formData.get("media_url") || "").trim()
  const link_url = String(formData.get("link_url") || "").trim()
  
  if (!content || platforms.length === 0) return { ok: false }
  const supabase = supabaseServer()
  const post = { 
    id: `sp_${Date.now()}`, 
    content, 
    platforms, 
    schedule, 
    channel,
    status: schedule ? "scheduled" : "draft", 
    created_at: new Date().toISOString(),
    time: schedule ? new Date(schedule).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "",
    media_url,
    link_url
  }
  await supabase.from("social_posts").insert(post)
  revalidatePath("/admin/social")
  return { ok: true }
}

//

async function sendNow(prev: any, formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/social/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
  revalidatePath("/admin/social")
  return { ok: res.ok }
}

async function reschedulePost(prev: any, formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  const schedule = String(formData.get("schedule") || "").trim()
  if (!id || !schedule) return { ok: false }
  const supabase = supabaseServer()
  const time = new Date(schedule).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  await supabase.from("social_posts").update({ schedule, status: "scheduled", time }).eq("id", id)
  revalidatePath("/admin/social")
  return { ok: true }
}

async function bulkReschedule(prev: any, formData: FormData) {
  "use server"
  const schedule = String(formData.get("schedule") || "").trim()
  const ids = formData.getAll("ids").map((v)=>String(v||"")).filter(Boolean)
  if (!schedule || ids.length === 0) return { ok: false }
  const supabase = supabaseServer()
  const time = new Date(schedule).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  await supabase.from("social_posts").update({ schedule, status: "scheduled", time }).in("id", ids)
  revalidatePath("/admin/social")
  return { ok: true }
}

async function deletePosts(prev: any, formData: FormData) {
  "use server"
  const ids = formData.getAll("ids").map((v)=>String(v||"")).filter(Boolean)
  if (ids.length === 0) return { ok: false }
  const supabase = supabaseServer()
  await supabase.from("social_posts").delete().in("id", ids)
  revalidatePath("/admin/social")
  return { ok: true }
}

export default async function AdminSocialPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const supabase = supabaseServer()
  const { data: listRaw } = await supabase.from("social_posts").select("*").order("created_at", { ascending: false })
  const list = (listRaw || []) as any[]
  const providers = {}

  const weekDates = getWeekDates()
  const monthParam = String(searchParams?.month || "")
  const monthBase = (() => {
    if (/^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number)
      return new Date(y, m - 1, 1)
    }
    return new Date()
  })()
  const currentMonth = monthBase.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const posts = (Array.isArray(list) && list.length) ? list : mockPosts
  const selectedChannel = String(searchParams?.channel || "").trim()
  const selectedView = String(searchParams?.view || "week").trim()
  const selectedTab = String(searchParams?.tab || "queue").trim()
  const filtered = selectedChannel ? posts.filter((p) => String(p.channel || "") === selectedChannel) : posts
  const queuePosts = filtered.filter((p) => String(p.status || "") === "scheduled")
  const draftPosts = filtered.filter((p) => String(p.status || "") === "draft")
  const sentPosts = filtered.filter((p) => String(p.status || "") === "published")
  const viewPosts = (() => {
    switch (selectedTab) {
      case "drafts": return draftPosts
      case "sent": return sentPosts
      case "queue": return queuePosts
      case "approvals": return []
      default: return filtered
    }
  })()
  const q = String(searchParams?.q || "").trim().toLowerCase()
  const statusQuery = String(searchParams?.status || "").trim().toLowerCase()
  const listPosts = viewPosts.filter((p) => {
    const byText = q ? String(p.content || "").toLowerCase().includes(q) : true
    const byStatus = statusQuery ? String(p.status || "").toLowerCase() === statusQuery : true
    return byText && byStatus
  })
  const byDay: Record<string, any[]> = {}
  for (const d of weekDates) {
    const key = d.toISOString().slice(0,10)
    byDay[key] = []
  }
  for (const p of viewPosts) {
    const iso = (() => {
      const s = String(p.schedule || "")
      if (!s) return ""
      try { return new Date(s.replace(" ", "T")).toISOString().slice(0,10) } catch { return "" }
    })()
    if (iso && byDay[iso]) byDay[iso].push(p)
  }

  async function fetchLinkMeta(url: string) {
    try {
      const res = await fetch(url, { method: "GET" })
      const html = await res.text()
      const get = (prop: string) => {
        const rgx = new RegExp(`<meta[^>]+property=[\"']${prop}[\"'][^>]+content=[\"']([^\"']+)[\"']`, "i")
        const m = html.match(rgx)
        return m ? m[1] : ""
      }
      const title = get("og:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "")
      const site = get("og:site_name")
      const image = get("og:image")
      return { title, site, image }
    } catch {
      return { title: "", site: "", image: "" }
    }
  }

  const uniqueLinks = Array.from(new Set(viewPosts.map((p) => String(p.link_url || "")).filter(Boolean)))
  const linkMetaMap: Record<string, { title?: string; site?: string; image?: string }> = {}
  for (const u of uniqueLinks.slice(0, 20)) {
    linkMetaMap[u] = await fetchLinkMeta(u)
  }
  const monthWeeks = getMonthMatrix(monthBase)
  const byDate: Record<string, any[]> = {}
  for (const w of monthWeeks) {
    for (const d of w) {
      const k = d.toISOString().slice(0,10)
      byDate[k] = []
    }
  }
  for (const p of viewPosts) {
    const s = String(p.schedule || "")
    if (!s) continue
    try {
      const iso = new Date(s.replace(" ", "T")).toISOString().slice(0,10)
      if (byDate[iso]) byDate[iso].push(p)
    } catch {}
  }
  const calendarWeeks = monthWeeks.map((week) => week.map((d) => ({
    key: d.toISOString().slice(0,10),
    dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d.getDate(),
    inMonth: d.getMonth() === monthBase.getMonth(),
    items: byDate[d.toISOString().slice(0,10)] || []
  })))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_320px] min-h-screen bg-background">
      {/* Left Sidebar (Workspace + Channels) */}
      <aside className="hidden xl:block border-r border-border/40 bg-white/60">
        <div className="p-4 space-y-4">
          <div className="text-xs text-muted-foreground">Workspace</div>
          <nav className="space-y-1">
            <a className="block px-3 py-2 rounded-md hover:bg-muted" href="#">Content</a>
            <a className="block px-3 py-2 rounded-md hover:bg-muted" href="#">Campaigns</a>
            <a className="block px-3 py-2 rounded-md hover:bg-muted" href="#">Analytics</a>
          </nav>
          <div className="pt-4 text-xs text-muted-foreground">Channels</div>
          <nav className="space-y-1">
            {mockChannels.map((c)=> (
              <a key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted" href={`/admin/social?channel=${encodeURIComponent(c.id)}&view=${encodeURIComponent(selectedView)}&tab=${encodeURIComponent(selectedTab)}`}>
                <span className={`w-2 h-2 rounded ${channelColors[c.id as keyof typeof channelColors]||'bg-gray-300'}`}></span>
                <span className="text-sm">{c.name}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Center Planner */}
      <div className="flex flex-col">
        {/* Header matching reference (Month/Week/Today) */}
        <div className="mx-4 mt-4 rounded-2xl border border-border/40 bg-white">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <a href={`/admin/social?tab=${encodeURIComponent(selectedTab)}&view=month${selectedChannel?`&channel=${encodeURIComponent(selectedChannel)}`:''}`} className={`px-3 py-1.5 rounded-md text-sm ${selectedView==='month'?'bg-muted text-foreground font-medium':'hover:bg-muted'}`}>Month</a>
              <a href={`/admin/social?tab=${encodeURIComponent(selectedTab)}&view=week${selectedChannel?`&channel=${encodeURIComponent(selectedChannel)}`:''}`} className={`px-3 py-1.5 rounded-md text-sm ${selectedView==='week'?'bg-muted text-foreground font-medium':'hover:bg-muted'}`}>Week</a>
              <a href={`/admin/social?tab=${encodeURIComponent(selectedTab)}&view=calendar${selectedChannel?`&channel=${encodeURIComponent(selectedChannel)}`:''}`} className={`px-3 py-1.5 rounded-md text-sm ${selectedView==='calendar'?'bg-muted text-foreground font-medium':'hover:bg-muted'}`}>Today</a>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">{currentMonth}</div>
              <a href="/api/oauth/meta/authorize" className="px-3 py-1.5 rounded-md text-sm border border-border/40 hover:bg-muted">Connect Meta</a>
            </div>
          </div>
        </div>

        {/* Planner body */}
        <div className="flex-1 overflow-auto bg-muted">
          <div className="px-4 md:px-6 py-4">
            {selectedView === 'list' ? (
              <div className="space-y-3">
                <form method="GET" className="flex items-center gap-2">
                  <input type="hidden" name="tab" value={selectedTab} />
                  <input type="hidden" name="view" value={selectedView} />
                  {selectedChannel ? (<input type="hidden" name="channel" value={selectedChannel} />) : null}
                  <input name="q" defaultValue={q} placeholder="Search content..." className="px-2 py-1.5 rounded-md bg-card border border-border/40 text-sm w-56" />
                  <select name="status" defaultValue={statusQuery} className="px-2 py-1.5 rounded-md bg-card border border-border/40 text-sm">
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                  <button className="px-2 py-1.5 rounded-md bg-card border border-border/40 text-sm">Filter</button>
                  <a href={`/admin/social?tab=${encodeURIComponent(selectedTab)}&view=${encodeURIComponent(selectedView)}${selectedChannel?`&channel=${encodeURIComponent(selectedChannel)}`:''}`} className="px-2 py-1.5 rounded-md bg-card border border-border/40 text-sm">Clear</a>
                </form>
                <ListBulk
                  posts={listPosts}
                  statusColors={statusColors as any}
                  platformColors={platformColors as any}
                  channelColors={channelColors as any}
                  deletePosts={deletePosts}
                  bulkReschedule={bulkReschedule}
                />
              </div>
            ) : selectedView === 'calendar' ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">{currentMonth}</div>
                  <div className="flex items-center gap-2">
                    <a href={`/admin/social?tab=${encodeURIComponent(selectedTab)}&view=calendar${selectedChannel?`&channel=${encodeURIComponent(selectedChannel)}`:''}&month=${(() => { const d=new Date(monthBase); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })()}`} className="px-2 py-1.5 rounded-md bg-card border border-border/40 text-sm">Prev</a>
                    <a href={`/admin/social?tab=${encodeURIComponent(selectedTab)}&view=calendar${selectedChannel?`&channel=${encodeURIComponent(selectedChannel)}`:''}&month=${(() => { const d=new Date(monthBase); d.setMonth(d.getMonth()+1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })()}`} className="px-2 py-1.5 rounded-md bg-card border border-border/40 text-sm">Next</a>
                    <a href={`/admin/social?tab=${encodeURIComponent(selectedTab)}&view=calendar${selectedChannel?`&channel=${encodeURIComponent(selectedChannel)}`:''}`} className="px-2 py-1.5 rounded-md bg-card border border-border/40 text-sm">This Month</a>
                  </div>
                </div>
                <MonthDnd
                  weeks={calendarWeeks}
                  onReschedule={reschedulePost}
                  statusColors={statusColors as any}
                  platformColors={platformColors as any}
                  channelColors={channelColors as any}
                />
              </div>
            ) : (
              <WeekDnd
                days={weekDates.map((d) => ({
                  key: d.toISOString().slice(0,10),
                  dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                  dayNum: d.getDate(),
                  items: byDay[d.toISOString().slice(0,10)] || []
                }))}
                onReschedule={reschedulePost}
                statusColors={statusColors as any}
                platformColors={platformColors as any}
                channelColors={channelColors as any}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Quick Actions */}
      <aside className="bg-white border-l border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Create Post</h3>
          <SocialPreviewComposer mockChannels={mockChannels} onSubmit={addPost} />
        </div>
      </aside>
    </div>
  )
}
