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
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Settings</h1>
          <p className="text-sm text-muted-foreground">Configure sender identity and signature</p>
        </div>
        <a href="/api/oauth/google/start" className="px-3 py-2 rounded-md border">Connect Gmail</a>
      </div>
      <SaveForm action={saveEmailConfig}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">From Name</label>
            <SelectOnFocusInput name="from_name" defaultValue={cfg.from_name || ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">From Email</label>
            <SelectOnFocusInput name="from_email" defaultValue={cfg.from_email || ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Reply-To</label>
            <SelectOnFocusInput name="reply_to" defaultValue={cfg.reply_to || ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">BCC</label>
            <SelectOnFocusInput name="bcc" defaultValue={cfg.bcc || ""} className="w-full p-2 border border-border/40 rounded" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Signature (Text)</label>
          <SelectOnFocusTextarea name="signature_text" defaultValue={cfg.signature_text || ""} className="w-full p-2 border border-border/40 rounded min-h-32" />
        </div>
        <SubmitButton>Save Settings</SubmitButton>
      </SaveForm>
    </div>
  )
}