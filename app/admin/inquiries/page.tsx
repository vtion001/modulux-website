import path from "path"
import { readFile } from "fs/promises"
import { InquiriesFilter } from "@/components/admin/inquiries-filter"

const filePath = path.join(process.cwd(), "data", "inquiries.json")

export default async function AdminInquiriesPage() {
  const raw = await readFile(filePath, "utf-8").catch(() => "[]")
  const list = JSON.parse(raw) as Array<{ id: string; name: string; email: string; phone: string; message: string; attachments: any[]; date: string }>
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">Messages submitted from the contact form</p>
      </div>
      {list.length === 0 ? (
        <div className="text-muted-foreground">No inquiries yet</div>
      ) : (
        <InquiriesFilter inquiries={list} />
      )}
    </div>
  )
}