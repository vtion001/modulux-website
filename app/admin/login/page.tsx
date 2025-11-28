import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SaveForm } from "@/components/admin/save-form"
import { signSession } from "@/lib/auth"

async function logout() {
  "use server"
  cookies().delete("admin_session")
  redirect("/admin/login")
}

export default function AdminLoginPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const hasError = searchParams?.error === "invalid"
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Admin Login</h1>
        {hasError && (
          <div className="mb-4 text-sm text-destructive">Authentication error</div>
        )}
        <div className="space-y-4">
          <SaveForm action={async (formData: FormData) => {
            "use server"
            const email = String(formData.get("email") || "").trim().toLowerCase()
            const password = String(formData.get("password") || "")
            const allowedEmail = (process.env.ADMIN_EMAIL || "admin@modulux.local").toLowerCase()
            const allowedPassword = process.env.ADMIN_PASSWORD || "modulux123!"
            const ok = email === allowedEmail && password === allowedPassword
            if (!ok) {
              redirect("/admin/login?error=invalid")
            }
            const token = signSession({ provider: "credentials", email, ts: Date.now() })
            cookies().set("admin_session", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 8,
            })
            redirect("/admin")
          }} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email</label>
              <input name="email" type="email" placeholder="admin@modulux.local" className="w-full p-3 border border-border/40 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Password</label>
              <input name="password" type="password" placeholder="••••••••" className="w-full p-3 border border-border/40 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Sign in</button>
          </SaveForm>
          <div className="relative">
            <div className="absolute inset-x-0 top-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>
          <a href="/api/oauth/google/authorize" className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Sign in with Google</a>
          <SaveForm action={logout}>
            <button className="w-full border border-border/50 text-foreground py-3 px-6 rounded-md hover:bg-card transition-all">Clear Session</button>
          </SaveForm>
        </div>
        <div className="mt-4 text-center">
          <a href="/proposal" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 text-sm transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
            View Business Proposal (public)
          </a>
        </div>
      </div>
    </main>
  )
}
