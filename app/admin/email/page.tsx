import path from "path"
import { readFile, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { SelectOnFocusInput, SelectOnFocusTextarea } from "@/components/select-on-focus"

const filePath = path.join(process.cwd(), "data", "email.json")

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
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Email Settings</h1>
              <p className="text-sm md:text-base/relaxed opacity-90">Configure sender identity, reply-to, and signature</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/api/oauth/google/start" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-sm transition-all duration-200 ease-out transform hover:bg-white/20 hover:-translate-y-[1px]" aria-label="Connect Gmail">
                Connect Gmail
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Sender Details</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-reply-to">Reply-To</label>
                  <SelectOnFocusInput id="email-reply-to" name="reply_to" defaultValue={cfg.reply_to || ""} className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-bcc">BCC</label>
                  <SelectOnFocusInput id="email-bcc" name="bcc" defaultValue={cfg.bcc || ""} className="w-full p-2 border border-border/40 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" htmlFor="email-signature">Signature (Text)</label>
                <SelectOnFocusTextarea id="email-signature" name="signature_text" defaultValue={cfg.signature_text || ""} className="w-full p-2 border border-border/40 rounded min-h-32 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="mt-3">
                <SubmitButton className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-all duration-200 ease-out transform hover:bg-primary/90 hover:-translate-y-[1px]" aria-label="Save email settings">
                  Save Settings
                </SubmitButton>
              </div>
            </SaveForm>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
            <h2 className="text-sm font-semibold text-foreground mb-3">Signature Preview</h2>
            <div className="rounded-lg border border-border/40 p-4 bg-background">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{cfg.signature_text || ""}</pre>
            </div>
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
