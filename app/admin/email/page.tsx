import path from "path"
import { readFile, writeFile } from "fs/promises"
import { Settings, Mail, Clock } from "lucide-react"
import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"

const filePath = path.join(process.cwd(), "data", "email.json")
const gmailStorePath = ""

type InboxItem = {
  id: string
  subject: string
  date: string
  from: string
  snippet: string
}

async function saveEmailConfig(prev: any, formData: FormData) {
  "use server"
  const from_name = String(formData.get("from_name") || "").trim()
  const from_email = String(formData.get("from_email") || "").trim()
  const reply_to = String(formData.get("reply_to") || "").trim()
  const bcc = String(formData.get("bcc") || "").trim()
  const signature_text = String(formData.get("signature_text") || "").replace(/\r/g, "")
  const raw = await readFile(filePath, "utf-8").catch(() => "{}")
  const prevCfg = JSON.parse(raw || "{}")
  const next = { ...prevCfg, from_name, from_email, reply_to, bcc, signature_text }
  await writeFile(filePath, JSON.stringify(next, null, 2))
  revalidatePath("/admin/email")
  return { ok: true, message: "Email configuration saved" }
}

export default async function AdminEmailPage() {
  const raw = await readFile(filePath, "utf-8").catch(() => "{}")
  const cfg = JSON.parse(raw || "{}")
  async function getToken() { return null }

  async function readInbox(): Promise<InboxItem[]> {
    const rawInbox = await readFile(filePath, "utf-8").catch(() => "{}")
    const store = JSON.parse(rawInbox || "{}")
    const arr = Array.isArray((store as any).inbox) ? (store as any).inbox : []
    if (arr.length > 0) return arr
    return [
      {
        id: `sample_${Date.now()}`,
        subject: "Welcome to Modulux",
        date: new Date().toLocaleString(),
        from: "support@modulux.local",
        snippet: "This is a sample message to preview the inbox."
      }
    ]
  }

  const inbox = await readInbox()
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Email</h1>
              <p className="text-sm md:text-base/relaxed opacity-90">Inbox and configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/api/oauth/google/authorize" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-sm transition-all duration-200 ease-out transform hover:bg-white/20 hover:-translate-y-[1px]" aria-label="Connect Gmail">
                Connect Gmail
              </a>
              <details className="relative">
                <summary className="list-none inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-sm transition-all duration-200 ease-out transform hover:bg-white/20 hover:-translate-y-[1px] cursor-pointer" aria-label="Email settings">
                  <Settings className="w-4 h-4" /> Settings
                </summary>
                <div className="absolute right-0 mt-2 w-[560px] max-w-[90vw] bg-white text-foreground rounded-lg border border-border/40 shadow-lg p-4">
                  <div className="text-sm font-semibold mb-3">Sender Details</div>
                  <SaveForm action={saveEmailConfig}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-from-name">From Name</label>
                        <SelectOnFocusInput id="email-from-name" name="from_name" defaultValue={cfg.from_name || ""} className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-from-email">From Email</label>
                        <SelectOnFocusInput id="email-from-email" name="from_email" defaultValue={cfg.from_email || ""} className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-reply-to">Reply-To</label>
                        <SelectOnFocusInput id="email-reply-to" name="reply_to" defaultValue={cfg.reply_to || ""} className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-bcc">BCC</label>
                        <SelectOnFocusInput id="email-bcc" name="bcc" defaultValue={cfg.bcc || ""} className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-signature">Signature (Text)</label>
                      <SelectOnFocusTextarea id="email-signature" name="signature_text" defaultValue={cfg.signature_text || ""} className="w-full p-2 border border-border/40 rounded min-h-32 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="mt-3">
                      <SubmitButton className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-all duration-200 ease-out transform hover:bg-primary/90 hover:-translate-y-[1px]" aria-label="Save email settings">
                        Save Settings
                      </SubmitButton>
                    </div>
                  </SaveForm>
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Signature Preview</div>
                    <div className="rounded-lg border border-border/40 p-3 bg-background">
                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{cfg.signature_text || ""}</pre>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-2"><Mail className="w-4 h-4" />Inbox</h2>
            {inbox.length === 0 ? (
              <div className="text-sm text-muted-foreground">No emails found or Gmail not connected.</div>
            ) : (
              <div className="divide-y">
                {inbox.map((m) => (
                  <div key={m.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground truncate max-w-[70%]">{m.subject}</div>
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" />{m.date}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{m.from}</div>
                    <div className="text-sm text-foreground/80 mt-1 line-clamp-2">{m.snippet}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Guidelines</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Use a recognizable sender name and email.</li>
              <li>Set reply-to for better conversation threading.</li>
              <li>Keep signatures concise and professional.</li>
            </ul>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Tips</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Test sending to multiple providers for deliverability.</li>
              <li>Avoid excessive images or links in signatures.</li>
              <li>Use BCC responsibly for batch emails.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
