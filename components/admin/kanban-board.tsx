"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

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

type Group = { key: Task["status"]; title: string; desc?: string }
type AssigneeMeta = Record<string, { name?: string; avatar_url?: string }>

export function KanbanBoard({ tasks, groups, actionUpsert, assigneeMeta, layout }: { tasks: Task[]; groups: Group[]; actionUpsert: (formData: FormData) => Promise<any>; assigneeMeta?: AssigneeMeta; layout?: "default" | "swimlanes" }) {
  const init = useMemo(() => {
    const map: Record<string, Task[]> = {}
    groups.forEach((g) => { map[g.key] = [] })
    tasks.forEach((t) => { (map[t.status] ||= []).push(t) })
    return map
  }, [tasks, groups])
  const [columns, setColumns] = useState<Record<string, Task[]>>(init)

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id)
  }

  const onDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/plain")
    if (!id) return
    const fromKey = Object.keys(columns).find((k) => columns[k].some((t) => t.id === id))
    if (!fromKey) return
    if (fromKey === status) return
    const task = columns[fromKey].find((t) => t.id === id)
    if (!task) return
    const next: Record<string, Task[]> = {}
    Object.keys(columns).forEach((k) => { next[k] = columns[k].filter((t) => t.id !== id) })
    const moved = { ...task, status }
    next[status] = [moved, ...next[status]]
    setColumns(next)
    const fd = new FormData()
    fd.set("id", moved.id)
    fd.set("project", moved.project)
    fd.set("title", moved.title)
    fd.set("description", moved.description)
    fd.set("assignees", moved.assignees.join(", "))
    fd.set("due_date", moved.due_date)
    fd.set("priority", moved.priority)
    fd.set("progress", String(moved.progress))
    fd.set("status", moved.status)
    actionUpsert(fd).then(() => { try { toast.success("Saved") } catch {} }).catch(() => { try { toast.error("Save failed") } catch {} })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {groups.map((g) => (
        <div key={g.key} className="rounded-xl border bg-card/60 p-3 flex flex-col"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, g.key)}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">{g.title}</div>
            <div className="text-xs text-muted-foreground">{columns[g.key]?.length || 0}</div>
          </div>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <input placeholder="Task title" className="px-2 py-1 rounded border text-xs" id={`add-title-${g.key}`} />
            <input placeholder="Project" className="px-2 py-1 rounded border text-xs" id={`add-project-${g.key}`} />
            <button
              className="px-2 py-1 rounded-md border text-xs"
              onClick={() => {
                const titleEl = document.getElementById(`add-title-${g.key}`) as HTMLInputElement | null
                const projectEl = document.getElementById(`add-project-${g.key}`) as HTMLInputElement | null
                const title = String(titleEl?.value || "").trim()
                if (!title) return
                const project = String(projectEl?.value || "")
                const fd = new FormData()
                fd.set("id", crypto.randomUUID())
                fd.set("project", project)
                fd.set("title", title)
                fd.set("description", "")
                fd.set("assignees", "")
                fd.set("due_date", "")
                fd.set("priority", "Medium")
                fd.set("progress", "0")
                fd.set("status", g.key)
                actionUpsert(fd)
                if (titleEl) titleEl.value = ""
                if (projectEl) projectEl.value = ""
              }}
            >
              Add
            </button>
          </div>
          <div className="space-y-2 min-h-[180px]">
            {layout === "swimlanes" ? (
              Object.entries(
                (columns[g.key] || []).reduce<Record<string, Task[]>>((acc, t) => {
                  const key = t.project || "General"
                  ;(acc[key] ||= []).push(t)
                  return acc
                }, {})
              ).map(([projectName, list]) => (
                <div key={projectName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground">{projectName}</div>
                    <div className="text-[11px] text-muted-foreground">{list.length}</div>
                  </div>
                  <AnimatePresence>
                    {list.map((t) => (
                      <motion.div key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} draggable onDragStart={(e) => onDragStart(e, t.id)} className="rounded-md border border-border/40 bg-background/70 p-2 cursor-move transition-transform hover:-translate-y-[1px] hover:shadow-sm">
                      <div className="text-sm font-medium text-foreground">{t.title}</div>
                      <div className="text-xs text-muted-foreground mb-2 truncate">{t.description}</div>
                      <div className="flex items-center justify-between mb-2">
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
                        <div className="text-[11px] text-muted-foreground">{t.due_date}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">Progress</span>
                          <input type="range" min={0} max={100} defaultValue={t.progress} onChange={(e) => {
                            const val = Number(e.currentTarget.value)
                            const fd = new FormData()
                            fd.set("id", t.id)
                            fd.set("project", t.project)
                            fd.set("title", t.title)
                            fd.set("description", t.description)
                            fd.set("assignees", t.assignees.join(", "))
                            fd.set("due_date", t.due_date)
                            fd.set("priority", t.priority)
                            fd.set("progress", String(val))
                            fd.set("status", t.status)
                            actionUpsert(fd).then(() => { try { toast.success("Saved") } catch {} }).catch(() => { try { toast.error("Save failed") } catch {} })
                          }} className="flex-1" />
                          <span className="text-[11px] text-muted-foreground w-8 text-right">{t.progress}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">Priority</span>
                          <select defaultValue={t.priority} onChange={(e) => {
                            const val = e.currentTarget.value
                            const fd = new FormData()
                            fd.set("id", t.id)
                            fd.set("project", t.project)
                            fd.set("title", t.title)
                            fd.set("description", t.description)
                            fd.set("assignees", t.assignees.join(", "))
                            fd.set("due_date", t.due_date)
                            fd.set("priority", val)
                            fd.set("progress", String(t.progress))
                            fd.set("status", t.status)
                            actionUpsert(fd).then(() => { try { toast.success("Saved") } catch {} }).catch(() => { try { toast.error("Save failed") } catch {} })
                          }} className="flex-1 px-2 py-1 rounded border text-xs">
                            <option>Urgent</option>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </div>
                      </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ))
            ) : (
              <AnimatePresence>
                {(columns[g.key] || []).map((t) => (
                  <motion.div key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} draggable onDragStart={(e) => onDragStart(e, t.id)} className="rounded-md border border-border/40 bg-background/70 p-2 cursor-move transition-transform hover:-translate-y-[1px] hover:shadow-sm">
                  <div className="text-sm font-medium text-foreground">{t.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">{t.project}</div>
                  <div className="text-xs text-muted-foreground mb-2 truncate">{t.description}</div>
                  <div className="flex items-center justify-between mb-2">
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
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{t.due_date}</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${t.priority === "Urgent" ? "bg-red-100 text-red-700" : t.priority === "High" ? "bg-orange-100 text-orange-700" : t.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{t.priority}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Progress</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={t.progress}
                        onChange={(e) => {
                          const val = Number(e.currentTarget.value)
                          const fd = new FormData()
                          fd.set("id", t.id)
                          fd.set("project", t.project)
                          fd.set("title", t.title)
                          fd.set("description", t.description)
                          fd.set("assignees", t.assignees.join(", "))
                          fd.set("due_date", t.due_date)
                          fd.set("priority", t.priority)
                          fd.set("progress", String(val))
                          fd.set("status", t.status)
                          actionUpsert(fd).then(() => { try { toast.success("Saved") } catch {} }).catch(() => { try { toast.error("Save failed") } catch {} })
                        }}
                        className="flex-1"
                      />
                      <span className="text-[11px] text-muted-foreground w-8 text-right">{t.progress}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Priority</span>
                      <select
                        defaultValue={t.priority}
                        onChange={(e) => {
                          const val = e.currentTarget.value
                          const fd = new FormData()
                          fd.set("id", t.id)
                          fd.set("project", t.project)
                          fd.set("title", t.title)
                          fd.set("description", t.description)
                          fd.set("assignees", t.assignees.join(", "))
                          fd.set("due_date", t.due_date)
                          fd.set("priority", val)
                          fd.set("progress", String(t.progress))
                          fd.set("status", t.status)
                          actionUpsert(fd).then(() => { try { toast.success("Saved") } catch {} }).catch(() => { try { toast.error("Save failed") } catch {} })
                        }}
                        className="flex-1 px-2 py-1 rounded border text-xs"
                      >
                        <option>Urgent</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {(columns[g.key] || []).length === 0 && (
              <div className="text-xs text-muted-foreground">No tasks</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
