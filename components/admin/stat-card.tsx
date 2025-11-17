"use client"
import Link from "next/link"

export function StatCard({ title, value, icon, href, subtext }: { title: string; value: string | number; icon: React.ReactNode; href?: string; subtext?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent/5">
      <div className="absolute -right-6 -top-6 opacity-20 text-accent">{icon}</div>
      <div className="p-6">
        <div className="text-sm text-muted-foreground mb-2">{title}</div>
        <div className="text-4xl font-bold mb-2">{value}</div>
        {subtext && <div className="text-xs text-muted-foreground mb-3">{subtext}</div>}
        {href && (
          <Link href={href} className="inline-flex items-center gap-2 text-primary text-sm">
            Manage
          </Link>
        )}
      </div>
    </div>
  )
}