import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { revalidatePath } from "next/cache"
import { Progress } from "@radix-ui/react-progress"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import { AutoSubmitDate, AutoSubmitRange, AutoSubmitSelect } from "@/components/admin/auto-submit"
import Link from "next/link"
import { KanbanBoard } from "@/components/admin/kanban-board"
import { AssigneeFilter } from "@/components/admin/assignee-filter"
import { TaskFilters } from "@/components/admin/task-filters"
import { supabaseServer } from "@/lib/supabase-server"

type Task = {
  id: string
  project: string
  title: string
  description: string
  assignees: string[]
  due_date: string
  priority: "Urgent" | "High" | "Medium" | "Low"
  progress: number
  status: "Backlog" | "In Progress" | "Ready" | "Completed"
}

const dataDir = path.join(process.cwd(), "data")
const tasksPath = path.join(dataDir, "project-tasks.json")

async function loadTasks(): Promise<Task[]> {
  try {
    try {
      const supabase = supabaseServer()
      const { data: rows } = await supabase.from("project_tasks").select("*").order("created_at", { ascending: false })
      const listDb = (rows || []).map((r: any) => ({ id: String(r.id), project: String(r.project || ""), title: String(r.title || ""), description: String(r.description || ""), assignees: Array.isArray(r.assignees) ? r.assignees : Array.isArray(r.assignees_json) ? r.assignees_json : [], due_date: String(r.due_date || ""), priority: String(r.priority || "Medium") as any, progress: Number(r.progress || 0), status: String(r.status || "Backlog") as any }))
      if (listDb.length) return listDb as Task[]
    } catch {}
    const raw = await readFile(tasksPath, "utf-8").catch(() => "[]")
    const list = JSON.parse(raw || "[]")
    if (Array.isArray(list) && list.length) return list
  } catch {}
  const seed: Task[] = [
    {
      id: crypto.randomUUID(),
      project: "Showroom Fit-out",
      title: "Wireframing",
      description: "Create wireframes for Dashboard",
      assignees: ["VD", "CO"],
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      priority: "High",
      progress: 30,
      status: "In Progress",
    },
    {
      id: crypto.randomUUID(),
      project: "Kitchen Cabinetry",
      title: "Design QA",
      description: "Review layouts and specs",
      assignees: ["MA"],
      due_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      priority: "Medium",
      progress: 10,
      status: "Backlog",
    },
    {
      id: crypto.randomUUID(),
      project: "Wardrobe Install",
      title: "Procurement",
      description: "Issue PO for materials",
      assignees: ["CO", "VD"],
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      priority: "Urgent",
      progress: 60,
      status: "In Progress",
    },
    {
      id: crypto.randomUUID(),
      project: "Bathroom Vanities",
      title: "Install Scheduling",
      description: "Coordinate installers and site schedule",
      assignees: ["MA"],
      due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      priority: "Low",
      progress: 100,
      status: "Completed",
    },
    {
      id: crypto.randomUUID(),
      project: "Office Fit-out",
      title: "Ready to Ship",
      description: "Pack and prepare delivery",
      assignees: ["CO"],
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      priority: "High",
      progress: 85,
      status: "Ready",
    },
  ]
  await mkdir(dataDir, { recursive: true })
  await writeFile(tasksPath, JSON.stringify(seed, null, 2))
  return seed
}

async function upsertTask(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim() || crypto.randomUUID()
  const project = String(formData.get("project") || "").trim() || "General"
  const title = String(formData.get("title") || "").trim() || "Untitled"
  const description = String(formData.get("description") || "").trim()
  const assignees = String(formData.get("assignees") || "").split(",").map((s) => s.trim()).filter(Boolean)
  const due_date = String(formData.get("due_date") || "").trim()
  const priority = (String(formData.get("priority") || "Medium").trim() as Task["priority"])
  const progress = Number(formData.get("progress") || 0)
  const status = (String(formData.get("status") || "Backlog").trim() as Task["status"])
  try {
    const supabase = supabaseServer()
    await supabase.from("project_tasks").upsert({ id, project, title, description, assignees, assignees_json: assignees, due_date, priority, progress, status })
  } catch {
    await mkdir(dataDir, { recursive: true })
    const list = await loadTasks()
    const next = list.some((t) => t.id === id)
      ? list.map((t) => (t.id === id ? { ...t, project, title, description, assignees, due_date, priority, progress, status } : t))
      : [{ id, project, title, description, assignees, due_date, priority, progress, status }, ...list]
    await writeFile(tasksPath, JSON.stringify(next, null, 2))
  }
  revalidatePath("/admin/project-management")
  return { ok: true }
}

async function deleteTask(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "").trim()
  if (!id) return { ok: false }
  try {
    const supabase = supabaseServer()
    await supabase.from("project_tasks").delete().eq("id", id)
  } catch {
    const list = await loadTasks()
    const next = list.filter((t) => t.id !== id)
    await writeFile(tasksPath, JSON.stringify(next, null, 2))
  }
  revalidatePath("/admin/project-management")
  return { ok: true }
}

async function createProjectWithTasks(formData: FormData) {
  "use server"
  const project = String(formData.get("project") || "").trim()
  if (!project) return { ok: false, message: "Project name is required" }
  const sourcing = String(formData.get("sourcing") || "Local").trim()
  const designStartRaw = String(formData.get("design_start") || "").trim()
  const installTargetRaw = String(formData.get("install_target") || "").trim()
  const assignees = String(formData.get("assignees") || "").split(",").map((s) => s.trim()).filter(Boolean)
  const designStart = designStartRaw ? new Date(designStartRaw) : new Date()
  const installTarget = installTargetRaw ? new Date(installTargetRaw) : new Date(Date.now() + 21 * 86400000)
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000).toISOString().slice(0, 10)

  const mk = (title: string, opts?: Partial<Task>) => ({
    id: crypto.randomUUID(),
    project,
    title,
    description: String(opts?.description || ""),
    assignees,
    due_date: String(opts?.due_date || ""),
    priority: (opts?.priority || "Medium") as Task["priority"],
    progress: Number(opts?.progress ?? 0),
    status: (opts?.status || "Backlog") as Task["status"],
  })

  const tasks: Task[] = []
  // Phase 1: Customer Engagement & Design Commitment
  tasks.push(mk("Initial Consultation", { due_date: addDays(designStart, 0), priority: "Medium" }))
  tasks.push(mk("Down-payment Collection (25%)", { due_date: addDays(designStart, 2), priority: "Urgent" }))
  tasks.push(mk("Conceptualization", { due_date: addDays(designStart, 5), priority: "Medium", status: "In Progress" }))
  tasks.push(mk("Concept Approval", { due_date: addDays(designStart, 7), priority: "High" }))
  tasks.push(mk("Detailed 3D Design & Itemized Quote", { due_date: addDays(designStart, 12), priority: "High" }))
  tasks.push(mk("Final Contract & Invoice", { due_date: addDays(designStart, 13), priority: "High" }))

  // Phase 2: Procurement
  if (sourcing.toLowerCase() === "import") {
    tasks.push(mk("Request & Approve Samples", { due_date: addDays(designStart, 16), priority: "High" }))
    tasks.push(mk("Negotiate FOB, 30% Deposit", { due_date: addDays(designStart, 18), priority: "High" }))
    tasks.push(mk("Arrange Sea Freight & Track BL", { due_date: addDays(designStart, 25), priority: "Medium" }))
    tasks.push(mk("Customs Clearance", { due_date: addDays(designStart, 35), priority: "Medium" }))
    tasks.push(mk("Warehouse Receipt → Final QC → Site Delivery", { due_date: addDays(designStart, 40), priority: "High" }))
  } else {
    tasks.push(mk("Issue PO & Materials List", { due_date: addDays(designStart, 16), priority: "High" }))
    tasks.push(mk("Weekly Production Updates", { due_date: addDays(designStart, 23), priority: "Medium" }))
    tasks.push(mk("Pre-shipment QC", { due_date: addDays(designStart, 28), priority: "High" }))
  }

  // Phase 3: Installation
  tasks.push(mk("Pre-install Site Survey", { due_date: addDays(installTarget, -7), priority: "High" }))
  tasks.push(mk("Installation per Blueprint", { due_date: addDays(installTarget, 0), priority: "High", status: "Ready" }))
  tasks.push(mk("Client Sign-off", { due_date: addDays(installTarget, 1), priority: "Medium" }))

  // Phase 4: After-Sales Support
  tasks.push(mk("Warranty Registration", { due_date: addDays(installTarget, 7), priority: "Low" }))
  tasks.push(mk("Support & Issue Tracking", { due_date: addDays(installTarget, 14), priority: "Low" }))

  // SOPs (optional lightweight backlog tasks)
  tasks.push(mk("Supplier Vetting & Contracts", { priority: "Medium" }))
  tasks.push(mk("Documentation Governance", { priority: "Low" }))
  tasks.push(mk("Weekly Client Updates", { priority: "Medium" }))

  try {
    const supabase = supabaseServer()
    await supabase.from("project_tasks").upsert(tasks.map((t) => ({
      id: t.id,
      project: t.project,
      title: t.title,
      description: t.description,
      assignees: t.assignees,
      assignees_json: t.assignees,
      due_date: t.due_date,
      priority: t.priority,
      progress: t.progress,
      status: t.status,
    })))
  } catch {
    await mkdir(dataDir, { recursive: true })
    const prev = await loadTasks()
    const next = [...tasks, ...prev]
    await writeFile(tasksPath, JSON.stringify(next, null, 2))
  }
  revalidatePath("/admin/project-management")
  return { ok: true }
}

function priorityClass(p: Task["priority"]) {
  switch (p) {
    case "Urgent":
      return "bg-red-100 text-red-700"
    case "High":
      return "bg-orange-100 text-orange-700"
    case "Medium":
      return "bg-yellow-100 text-yellow-700"
    case "Low":
      return "bg-green-100 text-green-700"
    default:
      return "bg-muted text-foreground"
  }
}

export default async function AdminProjectManagementPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const tasks = await loadTasks()
  const q = String(searchParams?.q || "").trim().toLowerCase()
  const view = String(searchParams?.view || "table")
  const layoutParam = String(searchParams?.layout || "")
  const statusCsv = String(searchParams?.status || "").trim()
  const priorityCsv = String(searchParams?.priority || "").trim()
  const assigneeFilter = String(searchParams?.assignee || "").trim().toUpperCase()
  const sortKey = String(searchParams?.sort || "").trim()
  let filtered = tasks
  if (q) {
    filtered = filtered.filter((t) => [t.title, t.description, t.project].some((v) => String(v || "").toLowerCase().includes(q)))
  }
  const statusTokens = statusCsv.split(",").map((s) => s.trim()).filter(Boolean)
  if (statusTokens.length) {
    filtered = filtered.filter((t) => statusTokens.includes(t.status))
  }
  const priorityTokens = priorityCsv.split(",").map((s) => s.trim()).filter(Boolean)
  if (priorityTokens.length) {
    filtered = filtered.filter((t) => priorityTokens.includes(t.priority))
  }
  const assigneeTokens = assigneeFilter.split(",").map((s) => s.trim()).filter(Boolean)
  if (assigneeTokens.length) {
    const up = assigneeTokens.map((s) => s.toUpperCase())
    filtered = filtered.filter((t) => t.assignees.some((a) => up.includes(a.toUpperCase())))
  }
  if (sortKey === "due_date") {
    filtered = filtered.slice().sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
  } else if (sortKey === "progress") {
    filtered = filtered.slice().sort((a, b) => b.progress - a.progress)
  }
  const profileRaw = await readFile(path.join(process.cwd(), "data", "profile.json"), "utf-8").catch(() => "{}")
  const profile = JSON.parse(profileRaw || "{}")
  const assigneeMeta: Record<string, { name?: string; avatar_url?: string }> = {}
  if (profile?.initials) assigneeMeta[String(profile.initials)] = { name: String(profile?.name || profile.initials), avatar_url: String(profile?.avatar_url || "") || undefined }
  const groups: { key: Task["status"]; title: string; desc: string }[] = [
    { key: "Backlog", title: "Backlog", desc: "Ideas and tasks waiting to start" },
    { key: "In Progress", title: "In Progress", desc: "Work currently underway" },
    { key: "Ready", title: "Ready to Ship", desc: "Completed and pending delivery" },
    { key: "Completed", title: "Completed", desc: "Done and archived" },
  ]

  async function emailProgress(formData: FormData) {
    "use server"
    const to = String(formData.get("to") || "").trim()
    const project = String(formData.get("project") || "").trim()
    const subject = String(formData.get("subject") || "").trim() || (project ? `Project Progress Update: ${project}` : "Project Progress Update")
    if (!to) return { ok: false }
    const all = await loadTasks()
    const list = project ? all.filter((t) => String(t.project||"").toLowerCase() === project.toLowerCase()) : all
    const sections = groups.map((g) => ({ key: g.key, title: g.title, items: list.filter((t) => t.status === g.key) }))
    const esc = (s: string) => String(s||"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    let html = ""
    html += `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;">`
    html += `<h2 style="margin:0 0 8px 0;">${esc(subject)}</h2>`
    if (project) html += `<div style="margin:0 0 16px 0;color:#555;">Project: ${esc(project)}</div>`
    for (const sec of sections) {
      if (sec.items.length === 0) continue
      html += `<h3 style="margin:16px 0 8px 0;">${esc(sec.title)}</h3>`
      html += `<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">`
      html += `<thead><tr>`
      html += `<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;font-size:13px;color:#555;">Task</th>`
      html += `<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;font-size:13px;color:#555;">Assignees</th>`
      html += `<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;font-size:13px;color:#555;">Due</th>`
      html += `<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;font-size:13px;color:#555;">Priority</th>`
      html += `<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;font-size:13px;color:#555;">Progress</th>`
      html += `</tr></thead><tbody>`
      for (const t of sec.items) {
        const assignees = Array.isArray(t.assignees) ? t.assignees.join(", ") : ""
        const bar = `<div style="width:120px;height:8px;background:#eee;border-radius:4px;overflow:hidden;"><div style="width:${Math.max(0,Math.min(100,Number(t.progress||0)))}%;height:8px;background:#111;border-radius:4px;"></div></div>`
        html += `<tr>`
        html += `<td style="padding:8px;border-bottom:1px solid #f0f0f0;"><div style="font-weight:600;">${esc(t.title)}</div><div style="font-size:12px;color:#555;">${esc(t.description||"")}</div></td>`
        html += `<td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#333;">${esc(assignees)}</td>`
        html += `<td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#333;">${esc(t.due_date||"")}</td>`
        html += `<td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#333;">${esc(t.priority)}</td>`
        html += `<td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#333;display:flex;align-items:center;gap:8px;">${bar}<span>${Number(t.progress||0)}%</span></td>`
        html += `</tr>`
      }
      html += `</tbody></table>`
    }
    html += `</div>`
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL || ""
      const res = await fetch(`${base}/api/gmail/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, subject, html }) })
      const ok = res.ok
      revalidatePath("/admin/project-management")
      return { ok }
    } catch {
      return { ok: false }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-sm text-muted-foreground">
            {view === "board"
              ? (layoutParam === "swimlanes"
                  ? "Board view with swimlanes by project. Drag to update status."
                  : "Board view. Drag cards across columns to update status.")
              : "Table view with inline status, progress, and due dates."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md overflow-hidden border">
            <Link href="/admin/project-management?view=table" className={`px-3 py-2 text-sm border-r ${view === "table" ? "bg-primary text-white" : "bg-background"}`}>Table</Link>
            <Link href="/admin/project-management?view=board" className={`px-3 py-2 text-sm border-r ${view === "board" && layoutParam !== "swimlanes" ? "bg-primary text-white" : "bg-background"}`}>Board</Link>
            <Link href="/admin/project-management?view=board&layout=swimlanes" className={`px-3 py-2 text-sm ${view === "board" && layoutParam === "swimlanes" ? "bg-primary text-white" : "bg-background"}`}>Swimlanes</Link>
          </div>
          <Link href="/projects" className="text-sm text-primary">View Public Projects</Link>
          <details className="ml-2" id="create-project">
            <summary className="cursor-pointer px-3 py-2 rounded-md border bg-primary text-white text-sm">Create Project</summary>
            <div className="mt-3 rounded-md border p-3 bg-card/60">
            <SaveForm action={createProjectWithTasks} successMessage="Project tasks created" className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Project Name</label>
                <input name="project" required placeholder="e.g., Showroom Fit-out" className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sourcing</label>
                <select name="sourcing" className="w-full p-2 rounded border">
                  <option>Local</option>
                  <option>Import</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Design Start</label>
                <input type="date" name="design_start" className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Installation Target</label>
                <input type="date" name="install_target" className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Default Assignees (initials)</label>
                <input name="assignees" placeholder="VD, CO, MA" className="w-full p-2 rounded border" />
              </div>
              <div className="md:col-span-2">
                <SubmitButton>Create Tasks</SubmitButton>
              </div>
            </SaveForm>
          </div>
        </details>
      </div>
      </div>

      <section className="rounded-xl border bg-card/60 p-4">
        <div className="mb-4">
          <div className="text-sm font-semibold">Send Progress Email</div>
          <div className="text-xs text-muted-foreground mb-2">Send an HTML summary for a specific project or all tasks</div>
          <SaveForm action={emailProgress} successMessage="Email sent" className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Project (optional)</label>
              <input name="project" placeholder="Project name" className="w-full p-2 rounded border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Recipient</label>
              <input type="email" name="to" placeholder="client@example.com" className="w-full p-2 rounded border" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Subject</label>
              <input name="subject" placeholder="Project Progress Update" className="w-full p-2 rounded border" />
            </div>
            <div className="md:col-span-5">
              <SubmitButton>Send Email</SubmitButton>
            </div>
          </SaveForm>
        </div>
        <TaskFilters
          basePath="/admin/project-management"
          preserve={{ view, layout: layoutParam }}
          initQ={q}
          initStatusCsv={statusCsv}
          initPriorityCsv={priorityCsv}
          initAssigneeCsv={assigneeFilter}
          initSort={sortKey}
        />
      </section>

      {String(searchParams?.view || "") === "board" && (
        <KanbanBoard tasks={filtered} groups={groups} actionUpsert={upsertTask as any} assigneeMeta={assigneeMeta} layout={String(searchParams?.layout || "") === "swimlanes" ? "swimlanes" : "default"} />
      )}

      <section className="rounded-xl border bg-card/60 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {groups.map((g) => {
            const count = filtered.filter((t) => t.status === g.key).length
            return (
              <div key={g.key} className="rounded-lg border border-border/40 p-4">
                <div className="text-sm font-semibold">{g.title}</div>
                <div className="text-xs text-muted-foreground mb-2">{g.desc}</div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            )
          })}
        </div>
      </section>

      {String(searchParams?.view || "") !== "board" && groups.map((g) => {
        const list = filtered.filter((t) => t.status === g.key)
        return (
          <section key={g.key} aria-labelledby={`group-${g.key}`} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 id={`group-${g.key}`} className="text-xl font-semibold">{g.title}</h2>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer px-3 py-2 rounded-md border">Add Task</summary>
                <div className="mt-3 rounded-md border p-3">
                  <SaveForm action={upsertTask}>
                    <input type="hidden" name="status" defaultValue={g.key} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Project</label>
                        <input name="project" className="w-full p-2 rounded border" placeholder="Project name" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Title</label>
                        <input name="title" className="w-full p-2 rounded border" placeholder="Task title" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground block mb-1">Description</label>
                        <textarea name="description" className="w-full p-2 rounded border" placeholder="What needs to be done" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Assignees (initials, comma-separated)</label>
                        <input name="assignees" className="w-full p-2 rounded border" placeholder="VD, CO, MA" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Due Date</label>
                        <input type="date" name="due_date" className="w-full p-2 rounded border" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Priority</label>
                        <select name="priority" className="w-full p-2 rounded border">
                          <option>Urgent</option>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Progress</label>
                        <input type="number" name="progress" min={0} max={100} defaultValue={0} className="w-full p-2 rounded border" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <SubmitButton>Add Task</SubmitButton>
                    </div>
                  </SaveForm>
                </div>
              </details>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30 sticky top-0 z-10">
                  <tr>
                    <th id="th-task" className="text-left p-2">Task</th>
                    <th id="th-description" className="text-left p-2">Description</th>
                    <th id="th-assignees" className="text-left p-2">Assignees</th>
                    <th id="th-due-date" className="text-left p-2">Due Date</th>
                    <th id="th-priority" className="text-left p-2">Priority</th>
                    <th id="th-progress" className="text-left p-2">Progress</th>
                    <th id="th-status" className="text-left p-2">Status</th>
                    <th id="th-actions" className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} className="border-t odd:bg-muted/20 hover:bg-muted/10">
                      <td className="p-2 align-top text-xs">
                        <div className="font-medium text-foreground">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.project}</div>
                      </td>
                      <td className="p-2 align-top text-xs">
                        <div className="text-muted-foreground">{t.description}</div>
                      </td>
                      <td className="p-2 align-top text-xs">
                        <div className="flex items-center gap-1">
                          {t.assignees.map((a) => {
                            const meta = assigneeMeta?.[a]
                            return meta?.avatar_url ? (
                              <img key={a} src={meta.avatar_url} alt={meta.name || a} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div key={a} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold text-foreground/80">{a}</div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="p-2 align-top text-xs">
                        <AutoSubmitDate
                          action={upsertTask as any}
                          hidden={[
                            { name: "id", value: t.id },
                            { name: "project", value: t.project },
                            { name: "title", value: t.title },
                            { name: "description", value: t.description },
                            { name: "assignees", value: t.assignees.join(", ") },
                            { name: "priority", value: t.priority },
                            { name: "progress", value: String(t.progress) },
                            { name: "status", value: t.status },
                          ]}
                          defaultValue={t.due_date}
                          className="text-xs text-muted-foreground px-2 py-1 rounded border"
                          labelledBy="th-due-date"
                        />
                      </td>
                      <td className="p-2 align-top text-xs">
                        <span className={`px-2 py-1 text-xs rounded-full ${priorityClass(t.priority)}`}>{t.priority}</span>
                      </td>
                      <td className="p-2 align-top w-40 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded bg-muted/50 overflow-hidden">
                            <Progress value={t.progress} className="h-2 w-full bg-transparent">
                              <div style={{ width: `${t.progress}%` }} className="h-full bg-primary rounded" />
                            </Progress>
                          </div>
                          <div className="text-xs text-muted-foreground w-10 text-right">{t.progress}%</div>
                        </div>
                        <div className="mt-2">
                          <AutoSubmitRange
                            action={upsertTask as any}
                            hidden={[
                              { name: "id", value: t.id },
                              { name: "project", value: t.project },
                              { name: "title", value: t.title },
                              { name: "description", value: t.description },
                              { name: "assignees", value: t.assignees.join(", ") },
                              { name: "due_date", value: t.due_date },
                              { name: "priority", value: t.priority },
                              { name: "status", value: t.status },
                            ]}
                            defaultValue={t.progress}
                            className="w-full"
                            labelledBy="th-progress"
                          />
                        </div>
                      </td>
                      <td className="p-2 align-top text-xs">
                        <AutoSubmitSelect
                          action={upsertTask as any}
                          hidden={[
                            { name: "id", value: t.id },
                            { name: "project", value: t.project },
                            { name: "title", value: t.title },
                            { name: "description", value: t.description },
                            { name: "assignees", value: t.assignees.join(", ") },
                            { name: "due_date", value: t.due_date },
                            { name: "priority", value: t.priority },
                            { name: "progress", value: String(t.progress) },
                          ]}
                          defaultValue={t.status}
                          className="px-2 py-1 rounded border text-xs"
                          name="status"
                          options={["Backlog", "In Progress", "Ready", "Completed"]}
                          labelledBy="th-status"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <div className="flex items-center gap-2">
                          <SaveForm action={deleteTask}>
                            <input type="hidden" name="id" defaultValue={t.id} />
                            <button className="px-2 py-1 rounded border text-xs">Delete</button>
                          </SaveForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <svg width="64" height="64" viewBox="0 0 24 24" className="mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M9 12h6" /><path d="M12 9v6" /></svg>
                            <div className="text-sm text-muted-foreground mb-3">No tasks in this group. Create a project to seed tasks.</div>
                            <a href="#create-project" className="px-3 py-2 rounded-md border text-sm">Create Project</a>
                          </div>
                        </div>
                      </td>
                  </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
