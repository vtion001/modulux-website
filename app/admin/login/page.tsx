import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { signSession } from "@/lib/auth"
import { SelectOnFocusInput } from "@/components/select-on-focus"

async function login(formData: FormData) {
  "use server"
  const email = String(formData.get("email") || "")
  const password = String(formData.get("password") || "")
  const envEmail = process.env.ADMIN_EMAIL || ""
  const envPassword = process.env.ADMIN_PASSWORD || ""
  if (!envEmail || !envPassword || email !== envEmail || password !== envPassword) {
    redirect("/admin/login?error=invalid")
  }
  const token = signSession({ email, ts: Date.now() })
  cookies().set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
  redirect("/admin?logged=1")
}

export default function AdminLoginPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const hasError = searchParams?.error === "invalid"
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Admin Login</h1>
        {hasError && (
          <div className="mb-4 text-sm text-destructive">Invalid credentials or missing configuration</div>
        )}
        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <SelectOnFocusInput
              type="email"
              name="email"
              required
              className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <SelectOnFocusInput
              type="password"
              name="password"
              required
              className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">
            Sign In
          </button>
        </form>
      </div>
    </main>
  )
}