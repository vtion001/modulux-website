import path from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { revalidatePath } from "next/cache"
import { Progress } from "@radix-ui/react-progress"
import { SaveForm, SubmitButton } from "@/components/admin/save-form"
import Link from "next/link"
import { KanbanBoard } from "@/components/admin/kanban-board"
import { AssigneeFilter } from "@/components/admin/assignee-filter"
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
  const statusFilter = String(searchParams?.status || "").trim()
  const priorityFilter = String(searchParams?.priority || "").trim()
  const assigneeFilter = String(searchParams?.assignee || "").trim().toUpperCase()
  const sortKey = String(searchParams?.sort || "").trim()
  let filtered = tasks
  if (q) {
    filtered = filtered.filter((t) => [t.title, t.description, t.project].some((v) => String(v || "").toLowerCase().includes(q)))
  }
  if (statusFilter && ["Backlog", "In Progress", "Ready", "Completed"].includes(statusFilter)) {
    filtered = filtered.filter((t) => t.status === statusFilter)
  }
  if (priorityFilter && ["Urgent", "High", "Medium", "Low"].includes(priorityFilter)) {
    filtered = filtered.filter((t) => t.priority === (priorityFilter as any))
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-sm text-muted-foreground">Track tasks across projects with assignees, priority, and progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/project-management?view=table" className="px-3 py-2 rounded-md border text-sm">Table</Link>
          <Link href="/admin/project-management?view=board" className="px-3 py-2 rounded-md border text-sm">Board</Link>
          <Link href="/admin/project-management?view=board&layout=swimlanes" className="px-3 py-2 rounded-md border text-sm">Swimlanes</Link>
          <Link href="/projects" className="text-sm text-primary">View Public Projects</Link>
        </div>
      </div>

      <section className="rounded-xl border bg-card/60 p-4">
        <form method="get" className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground block mb-1">Search</label>
            <input name="q" defaultValue={q} placeholder="Search tasks" className="w-full p-2 rounded border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Status</label>
            <select name="status" defaultValue={statusFilter} className="w-full p-2 rounded border">
              <option value="">All</option>
              <option>Backlog</option>
              <option>In Progress</option>
              <option>Ready</option>
              <option>Completed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Priority</label>
            <select name="priority" defaultValue={priorityFilter} className="w-full p-2 rounded border">
              <option value="">All</option>
              <option>Urgent</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <AssigneeFilter initial={assigneeFilter} />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Sort</label>
            <select name="sort" defaultValue={sortKey} className="w-full p-2 rounded border">
              <option value="">None</option>
              <option value="due_date">Due Date</option>
              <option value="progress">Progress</option>
            </select>
          </div>
          <div className="md:col-span-5 flex gap-2">
            <button className="px-3 py-2 rounded-md border">Apply</button>
            <Link href="/admin/project-management" className="px-3 py-2 rounded-md border">Reset</Link>
          </div>
        </form>
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
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-2">Task</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Assignees</th>
                    <th className="text-left p-2">Due Date</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">Progress</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-2 align-top">
                        <div className="font-medium text-foreground">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.project}</div>
                      </td>
                      <td className="p-2 align-top">
                        <div className="text-muted-foreground">{t.description}</div>
                      </td>
                      <td className="p-2 align-top">
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
                      <td className="p-2 align-top">
                        <div className="text-xs text-muted-foreground">{t.due_date}</div>
                      </td>
                      <td className="p-2 align-top">
                        <span className={`px-2 py-1 text-xs rounded-full ${priorityClass(t.priority)}`}>{t.priority}</span>
                      </td>
                      <td className="p-2 align-top w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded bg-muted/50 overflow-hidden">
                            <Progress value={t.progress} className="h-2 w-full bg-transparent">
                              <div style={{ width: `${t.progress}%` }} className="h-full bg-primary rounded" />
                            </Progress>
                          </div>
                          <div className="text-xs text-muted-foreground w-10 text-right">{t.progress}%</div>
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <div className="flex items-center gap-2">
                          <SaveForm action={upsertTask}>
                            <input type="hidden" name="id" defaultValue={t.id} />
                            <input type="hidden" name="project" defaultValue={t.project} />
                            <input type="hidden" name="title" defaultValue={t.title} />
                            <input type="hidden" name="description" defaultValue={t.description} />
                            <input type="hidden" name="assignees" defaultValue={t.assignees.join(", ")} />
                            <input type="hidden" name="due_date" defaultValue={t.due_date} />
                            <input type="hidden" name="priority" defaultValue={t.priority} />
                            <input type="hidden" name="progress" defaultValue={t.progress} />
                            <select name="status" defaultValue={t.status} className="px-2 py-1 rounded border text-xs">
                              <option>Backlog</option>
                              <option>In Progress</option>
                              <option>Ready</option>
                              <option>Completed</option>
                            </select>
                            <SubmitButton variant="outline" size="sm">Update</SubmitButton>
                          </SaveForm>
                          <form action={deleteTask}>
                            <input type="hidden" name="id" defaultValue={t.id} />
                            <button className="px-2 py-1 rounded border text-xs">Delete</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-sm text-muted-foreground">No tasks in this group</td>
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
