"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Props = {
  basePath: string
  preserve?: Record<string, string>
  initQ?: string
  initStatusCsv?: string
  initPriorityCsv?: string
  initAssigneeCsv?: string
  initSort?: string
}

export function TaskFilters({ basePath, preserve, initQ = "", initStatusCsv = "", initPriorityCsv = "", initAssigneeCsv = "", initSort = "" }: Props) {
  const [q, setQ] = useState(initQ)
  const [assignee, setAssignee] = useState(initAssigneeCsv)
  const [sort, setSort] = useState(initSort)
  const statusInit = useMemo(() => new Set(initStatusCsv.split(",").map((s) => s.trim()).filter(Boolean)), [initStatusCsv])
  const priorityInit = useMemo(() => new Set(initPriorityCsv.split(",").map((s) => s.trim()).filter(Boolean)), [initPriorityCsv])
  const [status, setStatus] = useState<Set<string>>(statusInit)
  const [priority, setPriority] = useState<Set<string>>(priorityInit)

  const push = () => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (assignee.trim()) params.set("assignee", assignee.trim())
    if (sort.trim()) params.set("sort", sort.trim())
    if (status.size) params.set("status", Array.from(status).join(","))
    if (priority.size) params.set("priority", Array.from(priority).join(","))
    if (preserve) {
      Object.entries(preserve).forEach(([k, v]) => { if (v) params.set(k, v) })
    }
    const url = `${basePath}?${params.toString()}`
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", url)
      window.dispatchEvent(new CustomEvent("filters:update"))
    }
  }

  useEffect(() => {
    const t = setTimeout(push, 300)
    return () => clearTimeout(t)
  }, [q])

  const toggle = (setFn: (s: Set<string>) => void, curr: Set<string>, val: string) => {
    const next = new Set(curr)
    if (next.has(val)) next.delete(val)
    else next.add(val)
    setFn(next)
    push()
  }

  const clearAll = () => {
    setQ("")
    setAssignee("")
    setSort("")
    setStatus(new Set())
    setPriority(new Set())
    setTimeout(push, 0)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <div className="md:col-span-2">
        <label className="text-xs text-muted-foreground block mb-1">Search</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks" className="w-full p-2 rounded border" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Status</label>
        <div className="flex flex-wrap gap-2 p-2 rounded border">
          {["Backlog", "In Progress", "Ready", "Completed"].map((s) => (
            <button key={s} type="button" onClick={() => toggle(setStatus, status, s)} className={`px-2 py-1 rounded-full text-xs border ${status.has(s) ? "bg-primary text-white" : "bg-background"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Priority</label>
        <div className="flex flex-wrap gap-2 p-2 rounded border">
          {["Urgent", "High", "Medium", "Low"].map((p) => (
            <button key={p} type="button" onClick={() => toggle(setPriority, priority, p)} className={`px-2 py-1 rounded-full text-xs border ${priority.has(p) ? "bg-primary text-white" : "bg-background"}`}>{p}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Assignees</label>
        <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="VD, CO, MA" className="w-full p-2 rounded border" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Sort</label>
        <select value={sort} onChange={(e) => { setSort(e.target.value); push() }} className="w-full p-2 rounded border">
          <option value="">None</option>
          <option value="due_date">Due Date</option>
          <option value="progress">Progress</option>
        </select>
      </div>
      <div className="md:col-span-5 flex gap-2">
        <button type="button" onClick={push} className="px-3 py-2 rounded-md border">Apply</button>
        <Link href={basePath} className="px-3 py-2 rounded-md border bg-background text-muted-foreground">Reset</Link>
        <button type="button" onClick={clearAll} className="px-3 py-2 rounded-md border text-sm">Clear</button>
      </div>
    </div>
  )
}

