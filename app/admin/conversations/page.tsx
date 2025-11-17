import path from "path"
import { readFile } from "fs/promises"

const filePath = path.join(process.cwd(), "data", "conversations.json")

export default async function AdminConversationsPage() {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw || "[]") as any[]
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversations</h1>
        <p className="text-sm text-muted-foreground">Unified inbox for social platforms</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {list.length === 0 ? (
          <div className="text-muted-foreground">No conversations yet</div>
        ) : (
          list.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{c.client}</div>
                <div className="text-xs text-muted-foreground">{c.platform} • {c.status}</div>
              </div>
              <div className="mt-2 space-y-2">
                {Array.isArray(c.messages) && c.messages.map((m: any, i: number) => (
                  <div key={i} className={`text-sm ${m.from === "agent" ? "text-foreground" : "text-muted-foreground"}`}>{m.text}</div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <form action={async (formData: FormData) => {
                  "use server"
                  const appendText = String(formData.get("text") || "").trim()
                  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/conversations/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appendText, status: "open" }) })
                }} className="md:col-span-3">
                  <input type="text" name="text" placeholder="Write a reply..." className="w-full p-2 border border-border/40 rounded" />
                  <div className="mt-2 flex gap-2">
                    <button className="px-3 py-2 rounded-md border">Send</button>
                    <button formAction={async () => {
                      "use server"
                      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/conversations/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "closed" }) })
                    }} className="px-3 py-2 rounded-md border">Close</button>
                  </div>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="rounded-xl border border-border p-4">
        <div className="text-sm text-muted-foreground mb-2">Start a new conversation</div>
        <form action={async (formData: FormData) => {
          "use server"
          const platform = String(formData.get("platform") || "").trim()
          const client = String(formData.get("client") || "").trim()
          const text = String(formData.get("text") || "").trim()
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/conversations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, client, text }) })
        }} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select name="platform" className="p-2 border border-border/40 rounded">
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter/X</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <input name="client" placeholder="Client handle" className="p-2 border border-border/40 rounded md:col-span-2" />
          </div>
          <input name="text" placeholder="Message" className="p-2 border border-border/40 rounded w-full" />
          <button className="px-3 py-2 rounded-md border">Create</button>
        </form>
      </div>
    </div>
  )
}