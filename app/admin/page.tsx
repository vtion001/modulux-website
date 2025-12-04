import { supabaseServer } from "@/lib/supabase-server"
import Link from "next/link"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { StatCard } from "@/components/admin/stat-card"
import { FolderOpen, FileText, Package, MessageSquare } from "lucide-react"
import { RecentInquiries } from "@/components/admin/recent-inquiries"
import { revalidatePath } from "next/cache"

export default async function AdminDashboardPage() {
  const supabase = supabaseServer()
  const [{ data: projects }, { data: blog }, { data: products }, { data: inquiries }] = await Promise.all([
    supabase.from("projects").select("*").order("year", { ascending: false }),
    supabase.from("blog_posts").select("*").order("date", { ascending: false }),
    supabase.from("products").select("*").order("name"),
    supabase.from("inquiries").select("*").order("date", { ascending: false }),
  ])

  const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  const envSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
  const envGoogleClientId = process.env.GOOGLE_CLIENT_ID || ""
  const envGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET || ""
  const envAdminEmail = process.env.ADMIN_EMAIL || ""
  let gmailConnected = false
  let gmailFrom = ""
  try {
    const fs = await import("fs/promises")
    const path = await import("path")
    const dataDir = path.join(process.cwd(), "data")
    const storePath = path.join(dataDir, "gmail.json")
    const emailCfgPath = path.join(dataDir, "email.json")
    const raw = await fs.readFile(storePath, "utf-8").catch(() => "{}")
    const cfg = JSON.parse(raw || "{}")
    gmailConnected = Boolean(cfg?.token?.refresh_token)
    const emailRaw = await fs.readFile(emailCfgPath, "utf-8").catch(() => "{}")
    const emailCfg = JSON.parse(emailRaw || "{}")
    gmailFrom = String(emailCfg?.from_email || envAdminEmail || "")
  } catch {}

  async function seedInitial() {
    "use server"
    await fetch("/api/seed/initial-content", { method: "POST" })
    revalidatePath("/admin")
    revalidatePath("/projects")
    revalidatePath("/blog")
  }
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Projects" value={(projects||[]).length} icon={<FolderOpen className="w-24 h-24" />} href="/admin/projects" />
        <StatCard title="Blog Posts" value={(blog||[]).length} icon={<FileText className="w-24 h-24" />} href="/admin/blog" />
        <StatCard title="Products" value={(products||[]).length} icon={<Package className="w-24 h-24" />} href="/admin/products" />
        <StatCard title="Inquiries" value={(inquiries||[]).length} icon={<MessageSquare className="w-24 h-24" />} href="/admin/inquiries" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="text-sm font-semibold">Environment Diagnostics</div>
          <div className="text-xs">Supabase URL: <span className={envSupabaseUrl?"text-green-600":"text-red-600"}>{envSupabaseUrl?"OK":"Missing"}</span></div>
          <div className="text-xs">Supabase Key: <span className={envSupabaseKey?"text-green-600":"text-red-600"}>{envSupabaseKey?"OK":"Missing"}</span></div>
          <div className="text-xs">Admin Email: <span className={envAdminEmail?"text-green-600":"text-red-600"}>{envAdminEmail||"Missing"}</span></div>
          <div className="text-xs">Google Client ID: <span className={envGoogleClientId?"text-green-600":"text-red-600"}>{envGoogleClientId?"OK":"Missing"}</span></div>
          <div className="text-xs">Google Client Secret: <span className={envGoogleClientSecret?"text-green-600":"text-red-600"}>{envGoogleClientSecret?"OK":"Missing"}</span></div>
          <div className="text-xs">Gmail Connected: <span className={gmailConnected?"text-green-600":"text-red-600"}>{gmailConnected?"Yes":"No"}</span></div>
          <div className="text-xs">From Email: <span className={gmailFrom?"text-green-600":"text-red-600"}>{gmailFrom||"Missing"}</span></div>
          <div className="flex items-center gap-2 pt-2">
            <Link href="/api/oauth/google/authorize" className="px-3 py-2 rounded-md border text-xs">Connect Gmail</Link>
            <Link href="/admin/proposals" className="px-3 py-2 rounded-md border text-xs">Test Email</Link>
          </div>
        </div>
        <div className="lg:col-span-2 rounded-lg border p-4">
          <div className="text-sm text-foreground">Quick access</div>
          <div className="mt-2 flex items-center gap-2">
            <Link
              href="/proposal"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-all duration-200 ease-out transform hover:bg-primary/90 hover:-translate-y-[1px]"
            >
              Business Proposal (public)
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsDashboard projects={projects||[]} blog={blog||[]} products={products||[]} inquiries={inquiries||[]} />
        </div>
        <RecentInquiries inquiries={inquiries||[]} />
      </div>
      <div className="mt-6">
        <form action={seedInitial}>
          <button className="px-3 py-2 rounded-md border text-sm">Seed Initial Content</button>
        </form>
      </div>
    </div>
  )
}
