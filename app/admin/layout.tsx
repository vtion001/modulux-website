import Link from "next/link"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"
import { ToastOnParam } from "@/components/admin/toast-on-param"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionCookie = cookies().get("admin_session")?.value
  const verified = sessionCookie ? verifySession(sessionCookie) : null

  async function logout() {
    "use server"
    cookies().delete("admin_session")
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {verified && (
        <header className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="font-bold">Admin</div>
            <div className="flex items-center gap-6 text-sm">
              <nav className="flex gap-6">
                <Link href="/admin">Dashboard</Link>
                <Link href="/admin/projects">Projects</Link>
                <Link href="/admin/blog">Blog</Link>
                <Link href="/admin/products">Products</Link>
                <Link href="/admin/inquiries">Inquiries</Link>
                <Link href="/admin/email">Email</Link>
                <Link href="/admin/social">Social Planner</Link>
                <Link href="/admin/conversations">Conversations</Link>
              </nav>
              <form action={logout}>
                <button className="px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <ToastOnParam param="logged" value="1" message="Signed in successfully" />
        {children}
      </main>
    </div>
  )
}