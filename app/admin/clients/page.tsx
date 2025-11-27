import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { revalidatePath } from "next/cache"
import { SaveForm, SubmitButton } from "/components/admin/save-form"
import { SelectOnFocusInput } from "/components/select-on-focus"

const clientsPath = path.join(process.cwd(), "data", "clients.json")

async function addClient(prev: any, formData: FormData) {
  "use server"
  const name = String(formData.get("name") || "").trim()
  const caseNo = String(formData.get("case_no") || "").trim()
  const carrier = String(formData.get("carrier") || "CCC Code").trim()
  const dfa = String(formData.get("dfa") || "").trim()
  const source = String(formData.get("source") || "Google").trim()
  const service = String(formData.get("service") || "Salvage").trim()
  const status = String(formData.get("status") || "New").trim()
  const score = Number(formData.get("score") || 1.0)
  const amount = Number(formData.get("amount") || 0)
  await mkdir(path.join(process.cwd(), "data"), { recursive: true })
  const raw = await readFile(clientsPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const list = db.list || []
  const id = `client_${Date.now()}`
  list.unshift({ id, name, caseNo, carrier, dfa, source, service, status, score, amount })
  await writeFile(clientsPath, JSON.stringify({ list }, null, 2))
  revalidatePath("/admin/clients")
  return { ok: true }
}

async function updateClientStatus(prev: any, formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  const status = String(formData.get("status") || "New")
  const raw = await readFile(clientsPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const list = (db.list || []).map((c: any) => (c.id === id ? { ...c, status } : c))
  await writeFile(clientsPath, JSON.stringify({ list }, null, 2))
  revalidatePath("/admin/clients")
  return { ok: true }
}

export default async function AdminClientsPage() {
  const raw = await readFile(clientsPath, "utf-8").catch(() => "{}")
  const db = JSON.parse(raw || "{}") as any
  const list = (db.list || []) as any[]
  const tabs = ["All Clients", "New", "Ongoing", "Payment Back", "Closed"]
  const counts: Record<string, number> = {
    "All Clients": list.length,
    New: list.filter((x) => x.status === "New").length,
    Ongoing: list.filter((x) => x.status === "Ongoing").length,
    "Payment Back": list.filter((x) => x.status === "Payment Back").length,
    Closed: list.filter((x) => x.status === "Closed").length,
  }
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
              <p className="text-xs text-gray-500">View all your client information.</p>
            </div>
            <div className="flex items-center gap-2">
              <a className="px-3 py-1.5 text-sm border rounded" href="/data/clients.json" download>
                Export
              </a>
              <SaveForm action={addClient} className="flex items-center gap-2">
                <SelectOnFocusInput name="name" placeholder="Client name" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="case_no" placeholder="Case #" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="carrier" placeholder="Carrier" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="dfa" placeholder="DFA (YYYY-MM-DD)" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="source" placeholder="Source" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="service" placeholder="Service" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="status" placeholder="Status" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="score" placeholder="Score" className="p-2 border rounded text-sm" />
                <SelectOnFocusInput name="amount" placeholder="Amount (₱)" className="p-2 border rounded text-sm" />
                <SubmitButton className="px-3 py-2 rounded-md bg-purple-600 text-white text-sm">Add Client</SubmitButton>
              </SaveForm>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tabs.map((t) => (
              <div key={t} className="text-sm text-gray-600">
                {t} ({counts[t] || 0})
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input placeholder="Search for Clients" className="p-2 border rounded text-sm" />
            <button className="px-2 py-1 text-sm border rounded">Filter</button>
            <button className="px-2 py-1 text-sm border rounded">Sort</button>
            <button className="px-2 py-1 text-sm border rounded">Columns</button>
            <SelectOnFocusInput name="date_range" placeholder="Jan 2021 – Apr 2021" className="p-2 border rounded text-sm" />
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Client</th>
                  <th className="text-left p-2">Case #</th>
                  <th className="text-left p-2">Carrier</th>
                  <th className="text-left p-2">DFA</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Score</th>
                  <th className="text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2">{c.caseNo}</td>
                    <td className="p-2">{c.carrier}</td>
                    <td className="p-2">{c.dfa}</td>
                    <td className="p-2">{c.source}</td>
                    <td className="p-2"><span className="px-2 py-1 rounded bg-green-100 text-green-700">{c.service}</span></td>
                    <td className="p-2">
                      <SaveForm action={updateClientStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" defaultValue={c.id} />
                        <select name="status" defaultValue={c.status} className="text-xs border rounded p-1">
                          <option>New</option>
                          <option>Ongoing</option>
                          <option>Payment Back</option>
                          <option>Closed</option>
                        </select>
                        <SubmitButton className="text-xs px-2 py-1 border rounded">Update</SubmitButton>
                      </SaveForm>
                    </td>
                    <td className="p-2"><span className="px-2 py-1 rounded bg-purple-100 text-purple-700">{Number(c.score||0).toFixed(1)}</span></td>
                    <td className="p-2 text-right text-blue-600">₱{Number(c.amount||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <button className="px-2 py-1 border rounded">Previous</button>
            <div>1 • 2 • 3</div>
            <button className="px-2 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
