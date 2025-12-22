import Link from "next/link"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"
import { ToastOnParam } from "@/components/admin/toast-on-param"
import { redirect } from "next/navigation"
import nextDynamic from "next/dynamic"
const AdminEstimatorPanel = nextDynamic(
  () => import("@/components/admin/admin-estimator-panel").then((mod) => mod.AdminEstimatorPanel),
  { ssr: false }
)
const AdminSidePanel = nextDynamic(
  () => import("@/components/admin/admin-side-panel").then((mod) => mod.AdminSidePanel),
  { ssr: false }
)

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
      {verified && <AdminSidePanel />}
      <main className={`max-w-none px-4 md:px-6 py-8 pt-16 ${verified ? "md:pl-64" : ""}`}>
        <ToastOnParam param="logged" value="1" message="Signed in successfully" />
        <AdminEstimatorPanel />
        {children}
      </main>
    </div>
  )
}
