import path from "path"
import { readFile } from "fs/promises"
import { SaveForm } from "@/components/admin/save-form"
import { ConversationList } from "@/components/admin/chat/conversation-list"
import { MessageLog } from "@/components/admin/chat/message-log"
import { SubmitButton } from "@/components/admin/save-form"

type Message = { from: "agent" | "client"; text: string; time?: string }
type Conversation = { id: string; client: string; platform: string; status: string; messages: Message[]; members?: string[] }

const filePath = path.join(process.cwd(), "data", "conversations.json")

export default async function AdminConversationsPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = (JSON.parse(raw || "[]") as any[]).map((c) => ({
    id: String(c.id || ""),
    client: String(c.client || ""),
    platform: String(c.platform || ""),
    status: String(c.status || "open"),
    messages: Array.isArray(c.messages) ? c.messages : [],
    members: Array.isArray(c.members) ? c.members : [],
  })) as Conversation[]

  const selectedId = String((searchParams?.id as string) || list[0]?.id || "")
  const current = list.find((c) => c.id === selectedId)

  return (
    <div className="h-[calc(100vh-64px)] bg-muted/40">
      <div className="mx-auto max-w-[1400px] h-full grid grid-cols-[64px_280px_1fr_320px]">
        {/* Left vertical nav */}
        <nav aria-label="Primary" className="bg-black text-white flex flex-col items-center py-4 gap-3">
          <a href="/admin" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/20" aria-label="Dashboard">SS</a>
          <div className="flex-1 flex flex-col items-center gap-2" role="group" aria-label="Sections">
            <a href="/admin/social" className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30" aria-label="Planner"></a>
            <a href="/admin/conversations" className="w-8 h-8 rounded-md bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-white/30" aria-current="page" aria-label="Messages"></a>
            <a href="/admin/projects" className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30" aria-label="Projects"></a>
            <a href="/admin/blog" className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30" aria-label="Blog"></a>
          </div>
          <a href="/admin/settings" className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30" aria-label="Settings"></a>
        </nav>

        {/* Conversations list */}
        <aside className="bg-white border-r border-border/50 overflow-hidden" aria-label="All chats">
          <div className="p-4 border-b border-border/50">
            <div className="text-xs text-muted-foreground">ALL CHATS</div>
            <div className="text-lg font-semibold">Messages <span className="text-muted-foreground">({list.length})</span></div>
            <form method="GET" className="mt-3 flex items-center gap-2" aria-label="Search conversations">
              <input name="q" className="w-full px-3 py-2 rounded-md border border-border/40 text-sm" placeholder="Search" aria-label="Search" />
            </form>
          </div>
          <ConversationList items={list} selectedId={selectedId} />
        </aside>

        {/* Conversation panel */}
        <main className="bg-white" aria-label="Conversation">
          {!current ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">Select a conversation</div>
          ) : (
            <div className="h-full grid grid-rows-[64px_1fr_72px]">
              {/* Header */}
              <div className="px-6 border-b border-border/50 flex items-center justify-between" role="toolbar" aria-label="Conversation toolbar">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-accent/20 border border-border/40" aria-hidden="true"></span>
                  <div>
                    <div className="font-medium">{current.client}</div>
                    <div className="text-xs text-muted-foreground">{current.platform}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 rounded-md border border-border/50 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Invite">Invite</button>
                  <SaveForm action={async (formData: FormData) => {
                    "use server"
                    const id = String(formData.get("id") || "")
                    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "closed" }) })
                  }}>
                    <input type="hidden" name="id" value={current.id} />
                    <button className="px-3 py-2 rounded-md border border-border/50 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="Close conversation">Close</button>
                  </SaveForm>
                </div>
              </div>

              {/* Messages */}
              <MessageLog messages={current.messages} />

              {/* Composer */}
              <div className="border-t border-border/50 px-6 py-3">
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
                  <div className="flex items-center gap-2">
                    <input id="composer" name="text" placeholder="Write a reply..." className="flex-1 px-3 py-2 rounded-md border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <SubmitButton className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 data-[pending=true]:opacity-70">Send</SubmitButton>
                  </div>
                </SaveForm>
              </div>
            </div>
          )}
        </main>

        {/* Details panel */}
        <aside className="bg-white border-l border-border/50 px-6 py-4" aria-label="Conversation details">
          {current && (
            <div className="space-y-4">
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
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
