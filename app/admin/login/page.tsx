import { cookies } from "next/headers"
import { redirect } from "next/navigation"

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
          <a href="/api/oauth/google/authorize" className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px]">Sign in with Google</a>
          <form action={logout}>
            <button className="w-full border border-border/50 text-foreground py-3 px-6 rounded-md hover:bg-card transition-all">Clear Session</button>
          </form>
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
