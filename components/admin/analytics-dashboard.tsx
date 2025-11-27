"use client"
import { useMemo, useState } from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts"

export function AnalyticsDashboard({ projects, blog, products, inquiries }: { projects: any[]; blog: any[]; products: any[]; inquiries: any[] }) {
  const [dataset, setDataset] = useState("inquiries")
  const [chart, setChart] = useState("line")

  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)"
  ]

  const data = useMemo(() => {
    if (dataset === "inquiries") {
      const buckets: Record<string, number> = {}
      for (const q of inquiries) {
        const d = q?.date ? new Date(q.date) : new Date()
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        buckets[key] = (buckets[key] || 0) + 1
      }
      return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ label: date, value: count }))
    }
    if (dataset === "blog") {
      const buckets: Record<string, number> = {}
      for (const p of blog) {
        const k = String(p.category || "Uncategorized")
        buckets[k] = (buckets[k] || 0) + 1
      }
      return Object.entries(buckets).map(([label, value]) => ({ label, value }))
    }
    if (dataset === "projects") {
      const buckets: Record<string, number> = {}
      for (const p of projects) {
        const k = String(p.type || "General")
        buckets[k] = (buckets[k] || 0) + 1
      }
      return Object.entries(buckets).map(([label, value]) => ({ label, value }))
    }
    const buckets: Record<string, number> = {}
    for (const p of products) {
      const k = String(p.category || "General")
      buckets[k] = (buckets[k] || 0) + 1
    }
    return Object.entries(buckets).map(([label, value]) => ({ label, value }))
  }, [dataset, blog, projects, products, inquiries])

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-4 flex items-center gap-3">
        <select value={dataset} onChange={(e) => setDataset(e.target.value)} className="border border-border/40 rounded px-3 py-2">
          <option value="inquiries">Inquiries</option>
          <option value="blog">Blog by Category</option>
          <option value="projects">Projects by Type</option>
          <option value="products">Products by Category</option>
        </select>
        <select value={chart} onChange={(e) => setChart(e.target.value)} className="border border-border/40 rounded px-3 py-2">
          <option value="line">Line</option>
          <option value="bar">Bar</option>
          <option value="pie">Pie</option>
        </select>
      </div>
      <div className="h-[320px]">
        {chart === "line" && (
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        {chart === "bar" && (
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {chart === "pie" && (
          <ResponsiveContainer>
            <PieChart>
              <Legend />
              <Tooltip />
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100}>
                {data.map((entry, index) => (
                  <Cell key={`c-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
