import { supabaseServer } from "@/lib/supabase-server"
import Link from "next/link"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { StatCard } from "@/components/admin/stat-card"
import { FolderOpen, FileText, Package, MessageSquare } from "lucide-react"
import { RecentInquiries } from "@/components/admin/recent-inquiries"

export default async function AdminDashboardPage() {
  const supabase = supabaseServer()
  const [{ data: projects }, { data: blog }, { data: products }, { data: inquiries }] = await Promise.all([
    supabase.from("projects").select("*").order("year", { ascending: false }),
    supabase.from("blog_posts").select("*").order("date", { ascending: false }),
    supabase.from("products").select("*").order("name"),
    supabase.from("inquiries").select("*").order("date", { ascending: false }),
  ])
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Projects" value={(projects||[]).length} icon={<FolderOpen className="w-24 h-24" />} href="/admin/projects" />
        <StatCard title="Blog Posts" value={(blog||[]).length} icon={<FileText className="w-24 h-24" />} href="/admin/blog" />
        <StatCard title="Products" value={(products||[]).length} icon={<Package className="w-24 h-24" />} href="/admin/products" />
        <StatCard title="Inquiries" value={(inquiries||[]).length} icon={<MessageSquare className="w-24 h-24" />} href="/admin/inquiries" />
      </div>
      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="text-sm text-foreground">Quick access</div>
        <Link
          href="/proposal"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-all duration-200 ease-out transform hover:bg-primary/90 hover:-translate-y-[1px]"
        >
          Business Proposal (public)
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsDashboard projects={projects||[]} blog={blog||[]} products={products||[]} inquiries={inquiries||[]} />
        </div>
        <RecentInquiries inquiries={inquiries||[]} />
      </div>
    </div>
  )
}
