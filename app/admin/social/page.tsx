import path from "path"
import { readFile, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "/components/select-on-focus"
import { ChevronLeft, ChevronRight, Search, Bell, ChevronDown } from "lucide-react"

const postsPath = path.join(process.cwd(), "data", "social.json")
const providersPath = path.join(process.cwd(), "data", "social-providers.json")

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
  const channel = String(formData.get("channel") || "").trim()
  
  if (!content || platforms.length === 0) return { ok: false }
  
  const raw = await readFile(postsPath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]")
  const post = { 
    id: `sp_${Date.now()}`, 
    content, 
    platforms, 
    schedule, 
    channel,
    status: schedule ? "scheduled" : "draft", 
    created_at: Date.now(),
    time: schedule ? new Date(schedule).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ""
  }
  list.unshift(post)
  await writeFile(postsPath, JSON.stringify(list, null, 2))
  revalidatePath("/admin/social")
  return { ok: true }
}

async function saveProviders(prev: any, formData: FormData) {
  "use server"
  const fb = String(formData.get("facebook_token") || "").trim()
  const ig = String(formData.get("instagram_token") || "").trim()
  const tw = String(formData.get("twitter_token") || "").trim()
  const prevRaw = await readFile(providersPath, "utf-8").catch(() => "{}")
  const prevCfg = JSON.parse(prevRaw || "{}")
  const next = {
    ...prevCfg,
    facebook: { ...(prevCfg.facebook || {}), token: fb },
    instagram: { ...(prevCfg.instagram || {}), token: ig },
    twitter: { ...(prevCfg.twitter || {}), token: tw },
  }
  await writeFile(providersPath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/social")
  return { ok: true }
}

async function sendNow(prev: any, formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/social/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
  revalidatePath("/admin/social")
  return { ok: res.ok }
}

export default async function AdminSocialPage() {
  const postsRaw = await readFile(postsPath, "utf-8").catch(() => "[]")
  const list = JSON.parse(postsRaw || "[]") as any[]
  const providersRaw = await readFile(providersPath, "utf-8").catch(() => "{}")
  const providers = JSON.parse(providersRaw || "{}")
  
  const weekDates = getWeekDates()
  const currentMonth = weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 border-b border-gray-100">
          <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Workspace */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Workspace</h3>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-1">
            <a href="#" className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Content
            </a>
            <a href="#" className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
              Campaigns
            </a>
            <a href="#" className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
              Analytics
            </a>
          </div>
        </div>

        {/* Channels */}
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Channels</h3>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-1">
            {mockChannels.map((channel) => (
              <a key={channel.id} href="#" className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                <div className={`w-2 h-2 ${channel.color} rounded-full`}></div>
                {channel.name}
              </a>
            ))}
          </div>
        </div>

        {/* New Post Button */}
        <div className="p-4 border-t border-gray-100">
          <SaveForm action={addPost}>
            <SubmitButton className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              New Post
            </SubmitButton>
          </SaveForm>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">{currentMonth}</h1>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Today
              </button>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md transition-colors">Month</button>
                <button className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md font-medium">Week</button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="min-w-max">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-white border-b border-gray-200 sticky top-0 z-10">
              {weekDates.map((date, index) => (
                <div key={index} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                  <div className="text-xs text-gray-500 font-medium tracking-wide">
                    {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mt-0.5">
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* All Day Events Bar */}
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">New Flavours Launch</span>
              </div>
            </div>

            {/* Time Grid */}
            <div className="relative">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="grid grid-cols-7 border-b border-gray-100">
                  {/* Time Label */}
                  <div className="absolute left-0 w-16 text-xs text-gray-500 text-right pr-3 pt-3 font-medium">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  
                  {/* Hour Columns */}
                  {weekDates.map((date, dayIndex) => {
                    const dayPosts = mockPosts.filter(post => {
                      const postDate = new Date(post.schedule)
                      return postDate.getDate() === date.getDate() && 
                             postDate.getMonth() === date.getMonth() && 
                             postDate.getFullYear() === date.getFullYear() &&
                             postDate.getHours() === hour
                    })

                    return (
                      <div key={dayIndex} className="border-r border-gray-100 last:border-r-0 min-h-20 pl-16 relative bg-white">
                        {dayPosts.map((post, postIndex) => (
                          <div key={post.id} className="absolute top-2 left-16 right-2 bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {post.platforms.map((platform) => (
                                <span 
                                  key={platform} 
                                  className={`px-2 py-1 text-xs text-white rounded-full font-medium ${
                                    platform === 'instagram' 
                                      ? platformColors[platform as keyof typeof platformColors]
                                      : platformColors[platform as keyof typeof platformColors] || 'bg-gray-500'
                                  }`}
                                >
                                  {platform === 'facebook' ? 'Facebook' :
                                   platform === 'instagram' ? 'Instagram' :
                                   platform === 'twitter' ? 'Twitter' :
                                   platform === 'linkedin' ? 'LinkedIn' :
                                   platform === 'blog' ? 'Blog' :
                                   platform === 'newsletter' ? 'Newsletter' : platform}
                                </span>
                              ))}
                              <div className={`w-2 h-2 rounded-full ${statusColors[post.status as keyof typeof statusColors]} flex-shrink-0`}></div>
                            </div>
                            <div className="text-xs text-gray-600 mb-1 font-medium">{post.time}</div>
                            <div className="text-sm text-gray-900 leading-relaxed">{post.content}</div>
                            {post.metrics && (
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">💬 {post.metrics.comments}</span>
                                <span className="flex items-center gap-1">❤️ {post.metrics.likes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Quick Actions */}
      <div className="w-80 bg-white border-l border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
          
          {/* New Post Form */}
          <SaveForm action={addPost} className="space-y-3">
            <div>
              <SelectOnFocusTextarea 
                name="content" 
                placeholder="What's on your mind?" 
                className="w-full p-3 border border-gray-200 rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50" 
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-600 mb-1 block font-medium">Channels</label>
              <div className="grid grid-cols-2 gap-2">
                {mockChannels.slice(0, 4).map((channel) => (
                  <label key={channel.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" name="channels" value={channel.id} className="rounded border-gray-300" />
                    <span>{channel.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-600 mb-1 block font-medium">Platforms</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(platformColors).map((platform) => (
                  <label key={platform} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" name="platforms" value={platform} className="rounded border-gray-300" />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <SelectOnFocusInput 
                name="schedule" 
                placeholder="Schedule for later..." 
                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50" 
              />
            </div>
            
            <SubmitButton className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Schedule Post
            </SubmitButton>
          </SaveForm>
        </div>
        
        {/* Provider Tokens */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Provider Tokens</h3>
          <SaveForm action={saveProviders} className="space-y-2">
            <SelectOnFocusInput 
              name="facebook_token" 
              defaultValue={providers.facebook?.token || ""} 
              placeholder="Facebook token" 
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50" 
            />
            <SelectOnFocusInput 
              name="instagram_token" 
              defaultValue={providers.instagram?.token || ""} 
              placeholder="Instagram token" 
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50" 
            />
            <SelectOnFocusInput 
              name="twitter_token" 
              defaultValue={providers.twitter?.token || ""} 
              placeholder="Twitter/X token" 
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50" 
            />
            <SubmitButton className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
              Save Tokens
            </SubmitButton>
          </SaveForm>
        </div>
      </div>
    </div>
  )
}