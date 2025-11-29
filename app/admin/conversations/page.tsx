import path from "path"
import { readFile } from "fs/promises"
import { SaveForm } from "@/components/admin/save-form"
import { ConversationList } from "@/components/admin/chat/conversation-list"
import { MessageLog } from "@/components/admin/chat/message-log"
import { SubmitButton } from "@/components/admin/save-form"
import { Search, PhoneCall, Heart, MoreHorizontal, Mic, Paperclip, Smile, Users, Star, FileText, Video, Music2, Image } from "lucide-react"

type Message = { from: "agent" | "client"; text: string; time?: string }
type Conversation = { id: string; client: string; platform: string; status: string; messages: Message[]; members?: string[] }

const filePath = path.join(process.cwd(), "data", "conversations.json")

export default async function AdminConversationsPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const parsed = (JSON.parse(raw || "[]") as any[])
  const list = parsed.map((c) => ({
    id: String(c.id || ""),
    client: String(c.client || ""),
    platform: String(c.platform || ""),
    status: String(c.status || "open"),
    messages: Array.isArray(c.messages) ? c.messages : [],
    members: Array.isArray(c.members) ? c.members : [],
  })) as Conversation[]

  const demoConversations: Conversation[] = [
    {
      id: "c-001",
      client: "David Peters",
      platform: "Chat",
      status: "open",
      messages: [
        { from: "client", text: "Hi David, have you got the project report pdf?", time: "10:32 AM" },
        { from: "agent", text: "NO. I did not get it", time: "10:33 AM" },
        { from: "client", text: "Ok, I will send it here. Please fill the details by today.", time: "10:34 AM" },
        { from: "client", text: "project_report.pdf", time: "10:35 AM" },
        { from: "agent", text: "Ok. Should I email it after filling the details?", time: "10:36 AM" },
        { from: "client", text: "Ya. I’ll be adding more team members to it.", time: "10:37 AM" },
        { from: "agent", text: "OK", time: "10:38 AM" },
      ],
      members: new Array(8).fill("")
    },
    {
      id: "c-002",
      client: "Lisa Roy",
      platform: "Chat",
      status: "open",
      messages: [
        { from: "client", text: "Hey, are you available tomorrow?", time: "09:20 AM" },
        { from: "agent", text: "Yes, after lunch works.", time: "09:21 AM" },
      ],
      members: new Array(6).fill("")
    }
  ]

  const effectiveList = list.length > 0 ? list : demoConversations

  const selectedId = String((searchParams?.id as string) || effectiveList[0]?.id || "")
  const current = effectiveList.find((c) => c.id === selectedId)

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted/40 overflow-hidden">
      <div className="mx-auto max-w-none px-2 md:px-4 min-h-full grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-0">

        {/* Conversations list */}
        <aside className="bg-muted/20 border-r border-border/50 overflow-hidden hidden lg:block" aria-label="All chats">
          <div className="p-4 border-b border-border/50">
            <div className="text-xs text-muted-foreground">ALL CHATS</div>
            <div className="text-lg font-semibold">Messages <span className="text-muted-foreground">({list.length})</span></div>
            <div className="mt-3 flex items-center gap-2" aria-label="Connected channels">
              <a href="/admin/social" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-foreground hover:bg-muted/70" aria-label="Manage channels">Manage</a>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-label="Instagram">IG</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-label="Facebook">FB</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-label="WhatsApp">WA</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-label="Email">Email</span>
            </div>
            <form method="GET" className="mt-3 relative" aria-label="Search conversations">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input name="q" className="w-full pl-9 pr-3 py-2 rounded-full border border-border/40 text-sm bg-white placeholder:text-muted-foreground" placeholder="Search Here..." aria-label="Search" />
            </form>
          </div>
          <ConversationList items={effectiveList} selectedId={selectedId} />
        </aside>

        {/* Conversation panel */}
        <main className="bg-white" aria-label="Conversation">
          {!current ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-sm text-muted-foreground">No conversation selected</div>
                <div className="flex items-center justify-center gap-2">
                  <a href="/admin/social" className="px-3 py-2 rounded-md border border-border/50 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20">Connect channels</a>
                  <a href="/admin/email" className="px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30">Start a message</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full grid grid-rows-[64px_1fr_80px]">
              {/* Header */}
              <div className="px-3 md:px-6 border-b border-border/50 flex items-center justify-between bg-white" role="toolbar" aria-label="Conversation toolbar">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-accent/20 border border-border/40" aria-hidden="true"></span>
                  <div>
                    <div className="font-medium">{current.client}</div>
                    <div className="text-xs text-muted-foreground">{current.platform}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Search in chat"><Search className="w-4 h-4" /></button>
                  <button className="p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Call"><PhoneCall className="w-4 h-4" /></button>
                  <button className="p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Favorite"><Heart className="w-4 h-4" /></button>
                  <details className="relative">
                    <summary className="list-none">
                      <button className="px-3 py-2 rounded-md border border-border/50 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Add to CRM">Add to CRM</button>
                    </summary>
                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-border/40 shadow-lg p-3 z-20">
                      <div className="text-sm font-medium mb-2">Capture Client</div>
                      <SaveForm
                        action={async (formData: FormData) => {
                          "use server"
                          const name = String(formData.get("name") || "").trim()
                          const email = String(formData.get("email") || "").trim()
                          const phone = String(formData.get("phone") || "").trim()
                          const company = String(formData.get("company") || "").trim()
                          const notes = String(formData.get("notes") || "").trim()
                          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/crm/lead`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name, email, phone, company, source: "Chat", notes })
                          })
                        }}
                      >
                        <div className="grid grid-cols-1 gap-2">
                          <input name="name" defaultValue={current.client} placeholder="Name" className="px-2 py-2 rounded border border-border/40 text-sm" />
                          <input name="email" placeholder="Email" className="px-2 py-2 rounded border border-border/40 text-sm" />
                          <input name="phone" placeholder="Phone" className="px-2 py-2 rounded border border-border/40 text-sm" />
                          <input name="company" placeholder="Company" className="px-2 py-2 rounded border border-border/40 text-sm" />
                          <textarea name="notes" placeholder="Notes" className="px-2 py-2 rounded border border-border/40 text-sm" />
                          <SubmitButton className="px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90">Save Lead</SubmitButton>
                        </div>
                      </SaveForm>
                    </div>
                  </details>
                  <a href="/api/oauth/meta/authorize" className="px-3 py-2 rounded-md border border-border/50 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Connect channels">Connect</a>
                  <SaveForm action={async (formData: FormData) => {
                    "use server"
                    const id = String(formData.get("id") || "")
                    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "closed" }) })
                  }}>
                    <input type="hidden" name="id" value={current.id} />
                    <button className="px-3 py-2 rounded-md border border-border/50 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Close conversation">Close</button>
                  </SaveForm>
                  <button className="p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="More"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Messages */}
              <MessageLog messages={current.messages} />

              {/* Composer */}
              <div className="border-t border-border/50 px-3 md:px-6 py-3 bg-white">
                <SaveForm
                  action={async (formData: FormData) => {
                    "use server"
                    const id = String(formData.get("id") || "").trim()
                    const appendText = String(formData.get("text") || "").trim()
                    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appendText, status: "open" }) })
                  }}
                >
                  <input type="hidden" name="id" value={current.id} />
                  <label className="sr-only" htmlFor="composer">Write a reply</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full bg-primary/10 px-4 py-3 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center"><Mic className="w-4 h-4" /></span>
                      <input id="composer" name="text" placeholder="Write Something..." className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground" />
                      <button type="button" className="p-2 rounded-full hover:bg-primary/20 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Attach file"><Paperclip className="w-4 h-4" /></button>
                      <button type="button" className="p-2 rounded-full hover:bg-primary/20 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Emoji"><Smile className="w-4 h-4" /></button>
                    </div>
                    <SubmitButton className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 data-[pending=true]:opacity-70" aria-label="Send">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
                    </SubmitButton>
                  </div>
                </SaveForm>
              </div>
            </div>
          )}
        </main>

        {/* Details panel */}
        <aside className="bg-muted/20 border-l border-border/50 px-4 md:px-6 py-4 hidden xl:block" aria-label="Conversation details">
          {current && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input className="w-full pl-9 pr-3 py-2 rounded-full border border-border/40 text-sm bg-white placeholder:text-muted-foreground" placeholder="Search Here..." aria-label="Search profile" />
              </div>
              <div className="flex flex-col items-center py-4">
                <span className="w-24 h-24 rounded-full bg-accent/20 border border-border/40" aria-hidden="true"></span>
                <div className="mt-3 text-center">
                  <div className="font-semibold">{current.client}</div>
                  <div className="text-xs text-muted-foreground">Junior Developer</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white border border-border/40 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"><Users className="w-4 h-4" /> Chat</button>
                <button className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white border border-border/40 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"><Video className="w-4 h-4" /> Video Call</button>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-border/40 hover:bg-muted"><Users className="w-4 h-4" /> View Friends</button>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-border/40 hover:bg-muted"><Star className="w-4 h-4" /> Add to Favorites</button>
              </div>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Attachments</div>
                <div className="grid grid-cols-4 gap-3">
                  <button className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-white border border-border/40 hover:bg-muted"><FileText className="w-5 h-5 text-primary" /> <span className="text-[11px]">PDF</span></button>
                  <button className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-white border border-border/40 hover:bg-muted"><Video className="w-5 h-5 text-primary" /> <span className="text-[11px]">VIDEO</span></button>
                  <button className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-white border border-border/40 hover:bg-muted"><Music2 className="w-5 h-5 text-primary" /> <span className="text-[11px]">MP3</span></button>
                  <button className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-white border border-border/40 hover:bg-muted"><Image className="w-5 h-5 text-primary" /> <span className="text-[11px]">IMAGE</span></button>
                </div>
                <button className="w-full px-3 py-2 rounded-full bg-white border border-border/40 hover:bg-muted">View All</button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Designers</div>
                  <div className="text-xs text-muted-foreground">Group</div>
                </div>
                <button className="px-3 py-2 rounded-md border border-border/50 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20">Invite</button>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent/10 text-accent text-xs">{current.status}</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Members</div>
                <div className="grid grid-cols-4 gap-2">
                  {(current.members || new Array(12).fill(""))
                    .slice(0,12)
                    .map((_, i) => (
                      <span key={i} className="w-12 h-12 rounded-md bg-muted border border-border/40" aria-label={`Member ${i+1}`}></span>
                    ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Channels</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-muted">IG</span>
                  <span className="px-2 py-1 rounded bg-muted">FB</span>
                  <span className="px-2 py-1 rounded bg-muted">WA</span>
                  <span className="px-2 py-1 rounded bg-muted">Email</span>
                  <a href="/admin/social" className="ml-auto px-2 py-1 rounded-md border border-border/40 hover:bg-muted">Manage</a>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
