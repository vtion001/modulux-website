import { supabaseServer } from "@/lib/supabase-server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { revalidatePath } from "next/cache"

export default async function AdminSettingsPage() {
  const supabase = supabaseServer()
  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    adminEmail: process.env.ADMIN_EMAIL || "",
  }
  let gmailConnected = false
  let emailCfg: any = {}
  try {
    const fs = await import("fs/promises")
    const path = await import("path")
    const dataDir = path.join(process.cwd(), "data")
    const storePath = path.join(dataDir, "gmail.json")
    const emailCfgPath = path.join(dataDir, "email.json")
    const raw = await fs.readFile(storePath, "utf-8").catch(() => "{}")
    const gcfg = JSON.parse(raw || "{}")
    gmailConnected = Boolean(gcfg?.token?.refresh_token)
    const ec = await fs.readFile(emailCfgPath, "utf-8").catch(() => "{}")
    emailCfg = JSON.parse(ec || "{}")
  } catch {}

  async function saveEmailConfig(formData: FormData) {
    "use server"
    const path = await import("path")
    const fs = await import("fs/promises")
    const dataDir = path.join(process.cwd(), "data")
    const emailCfgPath = path.join(dataDir, "email.json")
    const nextCfg = {
      from_name: String(formData.get("from_name") || "ModuLux"),
      from_email: String(formData.get("from_email") || env.adminEmail || ""),
      reply_to: String(formData.get("reply_to") || env.adminEmail || ""),
      bcc: String(formData.get("bcc") || ""),
      signature_text: String(formData.get("signature_text") || ""),
    }
    await fs.writeFile(emailCfgPath, JSON.stringify(nextCfg, null, 2))
    revalidatePath("/admin/settings")
  }

  async function disconnectGmail() {
    "use server"
    const path = await import("path")
    const fs = await import("fs/promises")
    const dataDir = path.join(process.cwd(), "data")
    const storePath = path.join(dataDir, "gmail.json")
    await fs.writeFile(storePath, JSON.stringify({}, null, 2))
    revalidatePath("/admin/settings")
  }

  async function sendTestEmail(formData: FormData) {
    "use server"
    const to = String(formData.get("to") || env.adminEmail || "")
    const subject = "ModuLux Email Test"
    const text = "This is a test email from the Admin Settings page."
    await fetch("/api/gmail/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, subject, text, includeSignature: true }) })
    revalidatePath("/admin/settings")
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="text-sm font-semibold">Environment</div>
          <div className="text-xs">Supabase URL: <span className={env.supabaseUrl?"text-green-600":"text-red-600"}>{env.supabaseUrl?"OK":"Missing"}</span></div>
          <div className="text-xs">Supabase Key: <span className={env.supabaseKey?"text-green-600":"text-red-600"}>{env.supabaseKey?"OK":"Missing"}</span></div>
          <div className="text-xs">Admin Email: <span className={env.adminEmail?"text-green-600":"text-red-600"}>{env.adminEmail||"Missing"}</span></div>
          <div className="text-xs">Google Client ID: <span className={env.googleClientId?"text-green-600":"text-red-600"}>{env.googleClientId?"OK":"Missing"}</span></div>
          <div className="text-xs">Google Client Secret: <span className={env.googleClientSecret?"text-green-600":"text-red-600"}>{env.googleClientSecret?"OK":"Missing"}</span></div>
          <div className="text-xs">Gmail Connected: <span className={gmailConnected?"text-green-600":"text-red-600"}>{gmailConnected?"Yes":"No"}</span></div>
          <div className="flex items-center gap-2 pt-2">
            <Link href="/api/oauth/google/authorize" className="px-3 py-2 rounded-md border text-xs">Connect Gmail</Link>
            <form action={disconnectGmail}><Button type="submit" variant="outline" className="text-xs">Disconnect</Button></form>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border p-4 space-y-3">
          <div className="text-sm font-semibold">Email Configuration</div>
          <form action={saveEmailConfig} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs">From Name<input name="from_name" defaultValue={String(emailCfg?.from_name||"ModuLux")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
            <label className="text-xs">From Email<input name="from_email" defaultValue={String(emailCfg?.from_email||env.adminEmail||"")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
            <label className="text-xs">Reply-To<input name="reply_to" defaultValue={String(emailCfg?.reply_to||env.adminEmail||"")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
            <label className="text-xs">BCC<input name="bcc" defaultValue={String(emailCfg?.bcc||"")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
            <label className="md:col-span-2 text-xs">Signature<textarea name="signature_text" defaultValue={String(emailCfg?.signature_text||"")} className="w-full px-2 py-2 rounded-md border text-sm min-h-[120px]" /></label>
            <div className="md:col-span-2 flex items-center justify-end"><Button type="submit">Save</Button></div>
          </form>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="text-sm font-semibold">Test Email</div>
        <form action={sendTestEmail} className="flex items-center gap-2">
          <input name="to" placeholder="Recipient" defaultValue={String(env.adminEmail||"")} className="px-2 py-2 rounded-md border text-sm" />
          <Button type="submit" variant="outline">Send Test</Button>
        </form>
      </div>

      <ProfileSettings />
    </div>
  )
}

async function ProfileSettings() {
  const path = await import("path")
  const fs = await import("fs/promises")
  const dataDir = path.join(process.cwd(), "data")
  const profilePath = path.join(dataDir, "profile.json")
  const raw = await fs.readFile(profilePath, "utf-8").catch(() => "{}")
  const profile = JSON.parse(raw || "{}")
  async function saveProfile(formData: FormData) {
    "use server"
    const path = await import("path")
    const fs = await import("fs/promises")
    const dataDir = path.join(process.cwd(), "data")
    const profilePath = path.join(dataDir, "profile.json")
    const name = String(formData.get("name") || "John Doe")
    const role = String(formData.get("role") || "Administrator")
    const email = String(formData.get("email") || "")
    const avatar_url = String(formData.get("avatar_url") || "")
    const initials = String(formData.get("initials") || (name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()))
    const next = { name, role, email, avatar_url, initials }
    await fs.writeFile(profilePath, JSON.stringify(next, null, 2))
    revalidatePath("/admin/settings")
  }
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="text-sm font-semibold">Profile Settings</div>
      <form action={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs">Name<input name="name" defaultValue={String(profile?.name||"John Doe")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
        <label className="text-xs">Role<input name="role" defaultValue={String(profile?.role||"Administrator")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
        <label className="text-xs">Email<input name="email" defaultValue={String(profile?.email||"")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
        <label className="text-xs">Avatar URL<input name="avatar_url" defaultValue={String(profile?.avatar_url||"")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
        <label className="text-xs">Initials<input name="initials" defaultValue={String(profile?.initials||"")} className="w-full px-2 py-2 rounded-md border text-sm" /></label>
        <div className="md:col-span-2 flex items-center justify-end"><Button type="submit">Save</Button></div>
      </form>
    </div>
  )
}
