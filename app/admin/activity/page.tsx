"use client"

import { useEffect, useState } from "react"
import { Bell, Info, Mail, Send, UserPlus, DollarSign } from "lucide-react"
import Link from "next/link"

type ActivityItem = {
    id: string
    type: "event" | "inquiry" | "rfq" | "lead" | "deal"
    title: string
    description: string
    timestamp: string
}

export default function AdminActivityPage() {
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAll() {
            try {
                const res = await fetch("/api/admin/activity")
                const data = await res.json()
                if (data.ok) setActivity(data.activity)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    const getIcon = (type: ActivityItem["type"]) => {
        switch (type) {
            case "event": return <Info className="w-5 h-5 text-blue-500" />
            case "inquiry": return <Mail className="w-5 h-5 text-emerald-500" />
            case "rfq": return <Send className="w-5 h-5 text-amber-500" />
            case "lead": return <UserPlus className="w-5 h-5 text-purple-500" />
            case "deal": return <DollarSign className="w-5 h-5 text-rose-500" />
            default: return <Bell className="w-5 h-5" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Activity History</h1>
                    <p className="text-sm text-muted-foreground">Unified log of all admin operations and events</p>
                </div>
                <Link href="/admin" className="text-sm text-primary hover:underline">Back to Dashboard</Link>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse">Loading activity logs...</div>
                ) : activity.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No recent activity.</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {activity.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-muted/10 transition-colors">
                                <div className="flex gap-4">
                                    <div className="mt-1 p-2 rounded-xl bg-background border border-border/40 shadow-sm">
                                        {getIcon(item.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic mb-2">{item.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted border border-border/50">
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
