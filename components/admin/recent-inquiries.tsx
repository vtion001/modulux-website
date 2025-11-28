import Link from "next/link"

export function RecentInquiries({ inquiries }: { inquiries: { id: string; name: string; email: string; phone: string; message: string; attachments?: any[]; date: string }[] }): JSX.Element {
  const items = Array.isArray(inquiries) ? inquiries.slice(0, 5) : []
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border/50 text-sm font-medium">Recent Inquiries</div>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No inquiries yet</div>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((q) => (
            <li key={q.id} className="p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(q.date).toLocaleString()}</div>
                </div>
                <div className="text-xs text-muted-foreground">{q.email} • {q.phone}</div>
                <div className="mt-2 text-sm line-clamp-3">{q.message}</div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{Array.isArray(q.attachments) ? `${q.attachments.length} file(s)` : "0 file(s)"}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="p-4 text-right">
        <Link href="/admin/inquiries" className="text-primary text-sm">View all</Link>
      </div>
    </div>
  )
}
