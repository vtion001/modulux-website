"use client"

import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { Bell, Info, Mail, Send, UserPlus, DollarSign, X, FolderOpen, FileText, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type ActivityItem = {
    id: string
    type: "event" | "inquiry" | "rfq" | "lead" | "deal" | "project" | "blog" | "product"
    title: string
    description: string
    timestamp: string
}

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchActivity = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/activity")
            const data = await res.json()
            if (data.ok) {
                setActivity(data.activity)
            }
        } catch (error) {
            console.error("Failed to fetch activity", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchActivity()
        }
    }, [isOpen])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const getIcon = (type: ActivityItem["type"]) => {
        switch (type) {
            case "event": return <Info className="w-4 h-4 text-blue-500" />
            case "inquiry": return <Mail className="w-4 h-4 text-emerald-500" />
            case "rfq": return <Send className="w-4 h-4 text-amber-500" />
            case "lead": return <UserPlus className="w-4 h-4 text-purple-500" />
            case "deal": return <DollarSign className="w-4 h-4 text-rose-500" />
            case "project": return <FolderOpen className="w-4 h-4 text-indigo-500" />
            case "blog": return <FileText className="w-4 h-4 text-orange-500" />
            case "product": return <Package className="w-4 h-4 text-cyan-500" />
            default: return <Bell className="w-4 h-4" />
        }
    }

    const getRelativeTime = (ts: string) => {
        const now = new Date()
        const then = new Date(ts)
        const diff = now.getTime() - then.getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(mins / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}d ago`
        if (hours > 0) return `${hours}h ago`
        if (mins > 0) return `${mins}m ago`
        return "just now"
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="side-panel-header-button relative group"
                aria-label="View notifications"
            >
                <Bell className={cn("side-panel-header-button-icon transition-transform", isOpen && "scale-110")} />
                {activity.length > 0 && (
                    <span className="side-panel-notification-badge animate-pulse">
                        {activity.length > 9 ? "9+" : activity.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-card border border-border/50 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" />
                            Recent Activity
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading && activity.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground italic">
                                Scanning logs...
                            </div>
                        ) : activity.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No recent activity found.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {activity.map((item) => (
                                    <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors cursor-default group">
                                        <div className="flex gap-3">
                                            <div className="mt-1 p-1.5 rounded-lg bg-background border border-border/40 shadow-sm group-hover:border-primary/20 transition-colors">
                                                {getIcon(item.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[13px] font-semibold text-foreground truncate">{item.title}</span>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                        {getRelativeTime(item.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed italic">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-border/50 bg-muted/10 text-center">
                        <Link
                            href="/admin/activity"
                            className="text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            View Full History
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
