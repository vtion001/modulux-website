import { supabaseServer } from "@/lib/supabase-server"
import { InquiriesFilter } from "@/components/admin/inquiries-filter"


export default async function AdminInquiriesPage() {
  const supabase = supabaseServer()
  const { data: listRaw } = await supabase
    .from("inquiries")
    .select("id,name,email,phone,message,attachments,date")
    .order("date", { ascending: false })
  const list = (listRaw || []) as Array<{ id: string; name: string; email: string; phone: string; message: string; attachments: any[]; date: string }>
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">
      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inquiries</h1>
              <p className="text-sm md:text-base/relaxed opacity-90">Messages submitted from the contact form</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-white/10 border border-white/20 text-sm">Total: {list.length}</span>
            </div>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-muted-foreground">No inquiries yet</div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <InquiriesFilter inquiries={list} />
        </div>
      )}
    </div>
  )
}
