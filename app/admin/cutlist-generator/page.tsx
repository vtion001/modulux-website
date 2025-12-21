"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, Trash2, Calculator, Download, RotateCcw, Settings, ChevronDown, ChevronUp, GripVertical, Pencil, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Panel {
    id: string
    length: number
    width: number
    quantity: number
    label?: string
}

interface StockSheet {
    id: string
    length: number
    width: number
    quantity: number
}

interface PlacedPanel {
    panelId: string
    sheetIndex: number
    x: number
    y: number
    length: number
    width: number
    rotated: boolean
}

interface CutResult {
    panel: string
    cut: string
    result: string
}

interface CabinetConfig {
    id: string
    type: "base" | "hanging" | "tall"
    linearMeters: number
    unitWidth: number
    height: number
    depth: number
    doorsPerUnit: 1 | 2
    shelves: number
    drawers: number
    order: number
}

interface CabinetTypeDefaults {
    height: number
    depth: number
    width: number
    doorsPerUnit: 1 | 2
    shelves: number
    drawers: number
}

// Default cabinet dimensions (mm)
const CABINET_DEFAULTS: Record<"base" | "hanging" | "tall", CabinetTypeDefaults> = {
    base: { height: 720, depth: 600, width: 600, doorsPerUnit: 2, shelves: 1, drawers: 0 },
    hanging: { height: 720, depth: 350, width: 600, doorsPerUnit: 2, shelves: 2, drawers: 0 },
    tall: { height: 2100, depth: 600, width: 600, doorsPerUnit: 2, shelves: 4, drawers: 0 },
}

export default function CutlistGeneratorPage() {
    const [unit, setUnit] = useState<"mm" | "m" | "cm" | "in">("mm")
    const [panels, setPanels] = useState<Panel[]>([
        { id: crypto.randomUUID(), length: 600, width: 400, quantity: 4 },
    ])
    const [stockSheets, setStockSheets] = useState<StockSheet[]>([
        { id: crypto.randomUUID(), length: 2440, width: 1220, quantity: 10 },
    ])
    const [kerfThickness, setKerfThickness] = useState(3.0)
    const [labelsOnPanels, setLabelsOnPanels] = useState(true)
    const [considerMaterial, setConsiderMaterial] = useState(true)
    const [edgeBanding, setEdgeBanding] = useState(false)
    const [grainDirection, setGrainDirection] = useState(true)

    const [calculated, setCalculated] = useState(false)
    const [placements, setPlacements] = useState<PlacedPanel[]>([])
    const [usedSheets, setUsedSheets] = useState(0)
    const [sheetLevels, setSheetLevels] = useState<{ y: number; h: number; xUsed: number }[][]>([])

    // Cabinet Builder state
    const [cabinetConfigs, setCabinetConfigs] = useState<CabinetConfig[]>([
        { id: crypto.randomUUID(), type: "base", linearMeters: 2, unitWidth: 600, height: 720, depth: 600, doorsPerUnit: 2, shelves: 1, drawers: 0, order: 0 },
    ])
    const [showCabinetBuilder, setShowCabinetBuilder] = useState(true)
    const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(null)
    const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(new Set())
    const [isPanelModalOpen, setIsPanelModalOpen] = useState(false)
    const [isStockModalOpen, setIsStockModalOpen] = useState(false)
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false)
    const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null)

    // Cabinet type defaults (configurable, persisted to localStorage)
    const [cabinetTypeDefaults, setCabinetTypeDefaults] = useState<Record<"base" | "hanging" | "tall", CabinetTypeDefaults>>(CABINET_DEFAULTS)
    const [settingsModalType, setSettingsModalType] = useState<"base" | "hanging" | "tall" | null>(null)

    // Load defaults from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("cabinetTypeDefaults")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setCabinetTypeDefaults({ ...CABINET_DEFAULTS, ...parsed })
            } catch { /* ignore */ }
        }
    }, [])

    // Save defaults to localStorage when changed
    const updateTypeDefaults = (type: "base" | "hanging" | "tall", field: keyof CabinetTypeDefaults, value: number) => {
        setCabinetTypeDefaults((prev) => {
            const updated = { ...prev, [type]: { ...prev[type], [field]: value } }
            localStorage.setItem("cabinetTypeDefaults", JSON.stringify(updated))
            return updated
        })
    }

    const unitLabel = useMemo(() => {
        switch (unit) {
            case "mm": return "mm"
            case "m": return "m"
            case "cm": return "cm"
            case "in": return "in"
            default: return "mm"
        }
    }, [unit])

    // Add panel
    const addPanel = () => {
        setPanels((prev) => [
            ...prev,
            { id: crypto.randomUUID(), length: 0, width: 0, quantity: 1 },
        ])
    }

    // Remove panel
    const removePanel = (id: string) => {
        setPanels((prev) => prev.filter((p) => p.id !== id))
    }

    // Update panel
    const updatePanel = (id: string, field: keyof Panel, value: number | string) => {
        setPanels((prev) =>
            prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        )
    }

    // Add stock sheet
    const addStockSheet = () => {
        setStockSheets((prev) => [
            ...prev,
            { id: crypto.randomUUID(), length: 2440, width: 1220, quantity: 1 },
        ])
    }

    // Remove stock sheet
    const removeStockSheet = (id: string) => {
        setStockSheets((prev) => prev.filter((s) => s.id !== id))
    }

    // Update stock sheet
    const updateStockSheet = (id: string, field: keyof StockSheet, value: number) => {
        setStockSheets((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        )
    }

    // Cabinet Builder functions
    const addCabinetConfig = (type: "base" | "hanging" | "tall" = "base") => {
        const defaults = cabinetTypeDefaults[type]
        const maxOrder = cabinetConfigs.length > 0 ? Math.max(...cabinetConfigs.map(c => c.order)) : -1
        setCabinetConfigs((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                type,
                linearMeters: 1,
                unitWidth: defaults.width,
                height: defaults.height,
                depth: defaults.depth,
                doorsPerUnit: defaults.doorsPerUnit,
                shelves: defaults.shelves,
                drawers: defaults.drawers,
                order: maxOrder + 1
            },
        ])
    }

    const removeCabinetConfig = (id: string) => {
        setCabinetConfigs((prev) => prev.filter((c) => c.id !== id))
    }

    const updateCabinetConfig = (id: string, field: keyof CabinetConfig, value: number | string) => {
        setCabinetConfigs((prev) =>
            prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        )
    }

    // Move cabinet config in order
    const moveCabinetConfig = (id: string, direction: "up" | "down") => {
        setCabinetConfigs((prev) => {
            const sorted = [...prev].sort((a, b) => a.order - b.order)
            const idx = sorted.findIndex((c) => c.id === id)
            if (idx === -1) return prev
            if (direction === "up" && idx > 0) {
                const temp = sorted[idx].order
                sorted[idx].order = sorted[idx - 1].order
                sorted[idx - 1].order = temp
            } else if (direction === "down" && idx < sorted.length - 1) {
                const temp = sorted[idx].order
                sorted[idx].order = sorted[idx + 1].order
                sorted[idx + 1].order = temp
            }
            return sorted
        })
    }

    // Toggle breakdown expansion
    const toggleBreakdown = (id: string) => {
        setExpandedBreakdowns((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    // Calculate materials breakdown for a single cabinet unit
    const getMaterialsBreakdown = (config: CabinetConfig) => {
        const unitCount = Math.floor((config.linearMeters * 1000) / config.unitWidth)
        if (unitCount <= 0) return null

        const shelfWidth = config.unitWidth - 36
        const shelfDepth = config.depth - 20
        const doorWidth = config.doorsPerUnit === 1 ? config.unitWidth : config.unitWidth / 2
        const doorHeight = config.type === "base" ? config.height - 100 : config.height
        const drawerFrontHeight = 180

        // Panel dimensions and quantities per unit
        const panels = [
            { name: "Left Side", l: config.height, w: config.depth, qty: 1, edgeBand: (config.height + config.depth) * 2 / 1000 },
            { name: "Right Side", l: config.height, w: config.depth, qty: 1, edgeBand: (config.height + config.depth) * 2 / 1000 },
            { name: "Top", l: config.unitWidth, w: config.depth, qty: 1, edgeBand: config.unitWidth / 1000 },
            { name: "Bottom", l: config.unitWidth, w: config.depth, qty: 1, edgeBand: config.unitWidth / 1000 },
            { name: "Back", l: config.height, w: config.unitWidth, qty: 1, edgeBand: 0 },
            ...(config.shelves > 0 ? [{ name: "Shelf", l: shelfWidth, w: shelfDepth, qty: config.shelves, edgeBand: (shelfWidth * config.shelves) / 1000 }] : []),
            ...(config.doorsPerUnit > 0 ? [{ name: "Door", l: doorHeight, w: doorWidth, qty: config.doorsPerUnit, edgeBand: ((doorHeight + doorWidth) * 2 * config.doorsPerUnit) / 1000 }] : []),
            ...(config.drawers > 0 ? [{ name: "Drawer Front", l: drawerFrontHeight, w: config.unitWidth, qty: config.drawers, edgeBand: ((drawerFrontHeight + config.unitWidth) * 2 * config.drawers) / 1000 }] : []),
        ]

        const hardware = {
            hinges: config.doorsPerUnit * 2,
            doorHandles: config.doorsPerUnit,
            drawerSlides: config.drawers,
            drawerHandles: config.drawers,
            shelfPins: config.shelves * 4,
        }

        const fasteners = {
            confirmatScrews: 24,
            camLocks: 8,
            hingeScrews: hardware.hinges * 4,
            backPanelNails: 20,
        }

        const totalEdgeBand = panels.reduce((sum, p) => sum + p.edgeBand, 0)

        return { unitCount, panels, hardware, fasteners, totalEdgeBand }
    }

    // Generate panels from cabinet configurations
    const generatePanelsFromCabinets = () => {
        const newPanels: Panel[] = []
        const drawerFrontHeight = 180 // Standard drawer front height

        for (const config of cabinetConfigs) {
            const unitCount = Math.floor((config.linearMeters * 1000) / config.unitWidth)

            if (unitCount <= 0) continue

            // Side Panels (Gables) - 2 per unit
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.height,
                width: config.depth,
                quantity: unitCount * 2,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Side`,
            })

            // Top Panel - 1 per unit
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.unitWidth,
                width: config.depth,
                quantity: unitCount,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Top`,
            })

            // Bottom Panel - 1 per unit
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.unitWidth,
                width: config.depth,
                quantity: unitCount,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Bottom`,
            })

            // Back Panel - 1 per unit
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.height,
                width: config.unitWidth,
                quantity: unitCount,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Back`,
            })

            // Shelves
            if (config.shelves > 0) {
                newPanels.push({
                    id: crypto.randomUUID(),
                    length: config.unitWidth - 36, // Account for side panel thickness
                    width: config.depth - 20, // Setback from front
                    quantity: unitCount * config.shelves,
                    label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Shelf`,
                })
            }

            // Doors
            const doorWidth = config.doorsPerUnit === 1 ? config.unitWidth : config.unitWidth / 2
            const doorHeight = config.type === "base" ? config.height - 100 : config.height // Base has kickboard
            newPanels.push({
                id: crypto.randomUUID(),
                length: doorHeight,
                width: doorWidth,
                quantity: unitCount * config.doorsPerUnit,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Door`,
            })

            // Drawer Fronts (for base and tall only)
            if ((config.type === "base" || config.type === "tall") && config.drawers > 0) {
                newPanels.push({
                    id: crypto.randomUUID(),
                    length: drawerFrontHeight,
                    width: config.unitWidth,
                    quantity: unitCount * config.drawers,
                    label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Drawer Front`,
                })
            }
        }

        if (newPanels.length === 0) {
            toast.error("No valid cabinet configurations to generate panels from")
            return
        }

        setPanels(newPanels)
        setCalculated(false)
        toast.success(`Generated ${newPanels.length} panel types from cabinet configurations`)
    }

    // First-Fit Decreasing Height bin packing algorithm
    const calculate = () => {
        if (panels.length === 0 || stockSheets.length === 0) {
            toast.error("Add at least one panel and one stock sheet")
            return
        }

        const stock = stockSheets[0]
        if (!stock || stock.length <= 0 || stock.width <= 0) {
            toast.error("Invalid stock sheet dimensions")
            return
        }

        // Expand panels by quantity
        const expandedPanels: { id: string; length: number; width: number; label: string }[] = []
        panels.forEach((p, pIdx) => {
            if (p.length <= 0 || p.width <= 0) return
            for (let i = 0; i < p.quantity; i++) {
                expandedPanels.push({
                    id: `${p.id}-${i}`,
                    length: p.length + kerfThickness,
                    width: p.width + kerfThickness,
                    label: p.label || `P${pIdx + 1}`,
                })
            }
        })

        if (expandedPanels.length === 0) {
            toast.error("No valid panels to place")
            return
        }

        // Sort by area descending (largest first)
        expandedPanels.sort((a, b) => b.length * b.width - a.length * a.width)

        const sheetW = stock.length
        const sheetH = stock.width
        const placed: PlacedPanel[] = []
        const sheets: { levels: { y: number; h: number; xUsed: number }[] }[] = []

        for (const panel of expandedPanels) {
            let fitted = false
            let pLen = panel.length
            let pWid = panel.width
            let rotated = false

            // Try both orientations if grain direction is not considered
            const tryRotations = grainDirection ? [false] : [false, true]

            for (const rot of tryRotations) {
                if (rot) {
                    pLen = panel.width
                    pWid = panel.length
                    rotated = true
                }

                if (pLen > sheetW || pWid > sheetH) {
                    if (!grainDirection && !rot) continue // Try the other rotation
                    continue
                }

                // Try to fit in existing sheets
                for (let sIdx = 0; sIdx < sheets.length && !fitted; sIdx++) {
                    const sheet = sheets[sIdx]

                    // Try existing levels
                    for (let lIdx = 0; lIdx < sheet.levels.length && !fitted; lIdx++) {
                        const level = sheet.levels[lIdx]
                        if (pWid <= level.h && level.xUsed + pLen <= sheetW) {
                            placed.push({
                                panelId: panel.id,
                                sheetIndex: sIdx,
                                x: level.xUsed,
                                y: level.y,
                                length: pLen,
                                width: pWid,
                                rotated,
                            })
                            level.xUsed += pLen
                            fitted = true
                        }
                    }

                    // Try new level on this sheet
                    if (!fitted) {
                        const usedHeight = sheet.levels.reduce((sum, l) => Math.max(sum, l.y + l.h), 0)
                        if (usedHeight + pWid <= sheetH && pLen <= sheetW) {
                            sheet.levels.push({ y: usedHeight, h: pWid, xUsed: pLen })
                            placed.push({
                                panelId: panel.id,
                                sheetIndex: sIdx,
                                x: 0,
                                y: usedHeight,
                                length: pLen,
                                width: pWid,
                                rotated,
                            })
                            fitted = true
                        }
                    }
                }

                if (fitted) break
            }

            // Create new sheet if not fitted
            if (!fitted) {
                if (pLen > sheetW || pWid > sheetH) {
                    toast.error(`Panel ${panel.label} is too large for the stock sheet`)
                    continue
                }
                const newSheetIdx = sheets.length
                sheets.push({ levels: [{ y: 0, h: pWid, xUsed: pLen }] })
                placed.push({
                    panelId: panel.id,
                    sheetIndex: newSheetIdx,
                    x: 0,
                    y: 0,
                    length: pLen,
                    width: pWid,
                    rotated,
                })
            }
        }

        setPlacements(placed)
        setUsedSheets(sheets.length)
        setSheetLevels(sheets.map(s => s.levels))
        setCalculated(true)
        toast.success(`Optimized layout: ${sheets.length} sheet(s) required`)
    }

    // Statistics
    const stats = useMemo(() => {
        if (!calculated || placements.length === 0) {
            return { usedSheets: 0, totalUsedArea: 0, totalWastedArea: 0, totalCuts: 0, cutLength: 0 }
        }

        const stock = stockSheets[0]
        const sheetArea = stock.length * stock.width
        const totalSheetArea = usedSheets * sheetArea
        const usedArea = placements.reduce((sum, p) => sum + p.length * p.width, 0)
        const wastedArea = totalSheetArea - usedArea
        const totalCuts = placements.length * 2
        const cutLength = placements.reduce((sum, p) => sum + (p.length + p.width) * 2, 0)

        // Convert stats based on unit if needed, but for now we just show numbers
        return {
            usedSheets,
            totalUsedArea: Math.round(usedArea * 100) / 100,
            totalWastedArea: Math.round(wastedArea * 100) / 100,
            wastePercent: Math.round((wastedArea / totalSheetArea) * 100),
            totalCuts,
            cutLength: Math.round(cutLength * 100) / 100,
        }
    }, [calculated, placements, usedSheets, stockSheets])

    // Cuts table
    const cutsData = useMemo<CutResult[]>(() => {
        if (!calculated) return []
        return placements.map((p, idx) => ({
            panel: `${idx + 1}`,
            cut: `${p.length.toFixed(2)} × ${p.width.toFixed(2)}`,
            result: `Sheet ${p.sheetIndex + 1} @ (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`,
        }))
    }, [calculated, placements])

    // Reset
    const reset = () => {
        setCalculated(false)
        setPlacements([])
        setUsedSheets(0)
        setSheetLevels([])
    }

    // Export JSON
    const exportJSON = () => {
        const data = {
            panels,
            stockSheets,
            unit,
            options: { kerfThickness, labelsOnPanels, considerMaterial, edgeBanding, grainDirection },
            results: calculated ? { usedSheets, placements, stats } : null,
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `cutlist-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Exported cutlist JSON")
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Cutlist Generator</h1>
                    <p className="text-sm text-muted-foreground">Optimize panel layouts on stock sheets</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center p-1 bg-muted/50 border border-border/40 rounded-lg mr-2">
                        {(["mm", "cm", "m", "in"] as const).map((u) => (
                            <button
                                key={u}
                                onClick={() => setUnit(u)}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-200 uppercase",
                                    unit === u
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={reset}>
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportJSON}>
                        <Download className="w-4 h-4 mr-1" /> Export
                    </Button>
                    <Button onClick={calculate}>
                        <Calculator className="w-4 h-4 mr-1" /> Calculate
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Inputs */}
                <div className="space-y-4">
                    {/* Cabinet Builder */}
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold">Cabinet Builder</h2>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded uppercase">Auto</span>
                            </div>
                            <button
                                onClick={() => setShowCabinetBuilder(!showCabinetBuilder)}
                                className="text-[10px] text-muted-foreground hover:text-foreground"
                            >
                                {showCabinetBuilder ? "Hide" : "Show"}
                            </button>
                        </div>
                        {showCabinetBuilder && (
                            <div className="space-y-3">
                                {/* Add Cabinet Buttons with Settings */}
                                <div className="flex gap-1">
                                    {(["base", "hanging", "tall"] as const).map((type) => {
                                        const colors = {
                                            base: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20",
                                            hanging: "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20",
                                            tall: "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20",
                                        }
                                        return (
                                            <div key={type} className="flex-1 flex">
                                                <button
                                                    onClick={() => addCabinetConfig(type)}
                                                    className={cn("flex-1 px-2 py-1.5 text-[10px] font-bold uppercase border rounded-l transition-colors", colors[type])}
                                                >
                                                    + {type}
                                                </button>
                                                <button
                                                    onClick={() => setSettingsModalType(type)}
                                                    className={cn("px-1.5 py-1.5 border border-l-0 rounded-r transition-colors", colors[type])}
                                                    title={`Configure ${type} defaults`}
                                                >
                                                    <Settings className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Settings Modal */}
                                {settingsModalType && (
                                    <div className="p-3 bg-muted/50 rounded-lg border border-border/30 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase">{settingsModalType} Defaults</span>
                                            <button onClick={() => setSettingsModalType(null)} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[9px] text-muted-foreground uppercase">Height</label>
                                                <input type="number" className="w-full p-1.5 text-xs border rounded bg-background" value={cabinetTypeDefaults[settingsModalType].height} onChange={(e) => updateTypeDefaults(settingsModalType, "height", Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-muted-foreground uppercase">Depth</label>
                                                <input type="number" className="w-full p-1.5 text-xs border rounded bg-background" value={cabinetTypeDefaults[settingsModalType].depth} onChange={(e) => updateTypeDefaults(settingsModalType, "depth", Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-muted-foreground uppercase">Width</label>
                                                <input type="number" className="w-full p-1.5 text-xs border rounded bg-background" value={cabinetTypeDefaults[settingsModalType].width} onChange={(e) => updateTypeDefaults(settingsModalType, "width", Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-muted-foreground uppercase">Doors</label>
                                                <select className="w-full p-1.5 text-xs border rounded bg-background" value={cabinetTypeDefaults[settingsModalType].doorsPerUnit} onChange={(e) => updateTypeDefaults(settingsModalType, "doorsPerUnit", Number(e.target.value))}>
                                                    <option value={1}>1</option>
                                                    <option value={2}>2</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-muted-foreground uppercase">Shelves</label>
                                                <input type="number" min={0} max={5} className="w-full p-1.5 text-xs border rounded bg-background" value={cabinetTypeDefaults[settingsModalType].shelves} onChange={(e) => updateTypeDefaults(settingsModalType, "shelves", Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-muted-foreground uppercase">Drawers</label>
                                                <input type="number" min={0} max={4} className="w-full p-1.5 text-xs border rounded bg-background" value={cabinetTypeDefaults[settingsModalType].drawers} onChange={(e) => updateTypeDefaults(settingsModalType, "drawers", Number(e.target.value))} disabled={settingsModalType === "hanging"} />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground">Settings saved to browser</p>
                                    </div>
                                )}

                                {/* Wireframe Strip */}
                                {cabinetConfigs.length > 0 && (
                                    <div className="p-2 bg-muted/30 rounded-lg border border-border/20 overflow-x-auto">
                                        <div className="flex gap-1" style={{ minWidth: "max-content" }}>
                                            {[...cabinetConfigs].sort((a, b) => a.order - b.order).map((config, idx) => {
                                                const unitCount = Math.floor((config.linearMeters * 1000) / config.unitWidth)
                                                const scale = 0.08
                                                const svgH = config.height * scale
                                                const svgW = config.unitWidth * scale
                                                const typeColors = { base: "#10b981", hanging: "#3b82f6", tall: "#f59e0b" }
                                                return (
                                                    <div
                                                        key={config.id}
                                                        className={cn(
                                                            "flex flex-col items-center cursor-pointer transition-all p-1 rounded",
                                                            selectedCabinetId === config.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                                                        )}
                                                        onClick={() => {
                                                            setSelectedCabinetId(config.id);
                                                            setEditingCabinetId(config.id);
                                                        }}
                                                        title={`${config.type.toUpperCase()} #${idx + 1}\n${config.height}×${config.depth}×${config.unitWidth}mm\n${unitCount} unit${unitCount !== 1 ? "s" : ""}`}
                                                    >
                                                        <span className="text-[8px] text-muted-foreground mb-0.5">{config.unitWidth}</span>
                                                        <svg width={svgW + 10} height={svgH + 10} className="block">
                                                            <rect x={5} y={5} width={svgW} height={svgH} fill="white" stroke={typeColors[config.type]} strokeWidth={1.5} rx={2} />
                                                            {/* Doors */}
                                                            {config.doorsPerUnit === 2 ? (
                                                                <>
                                                                    <rect x={6} y={6} width={svgW / 2 - 2} height={(config.type === "base" ? svgH - 10 : svgH) - 2} fill="none" stroke={typeColors[config.type]} strokeWidth={0.5} strokeDasharray="2,1" />
                                                                    <rect x={5 + svgW / 2 + 1} y={6} width={svgW / 2 - 2} height={(config.type === "base" ? svgH - 10 : svgH) - 2} fill="none" stroke={typeColors[config.type]} strokeWidth={0.5} strokeDasharray="2,1" />
                                                                </>
                                                            ) : (
                                                                <rect x={6} y={6} width={svgW - 2} height={(config.type === "base" ? svgH - 10 : svgH) - 2} fill="none" stroke={typeColors[config.type]} strokeWidth={0.5} strokeDasharray="2,1" />
                                                            )}
                                                            {/* Drawers */}
                                                            {config.drawers > 0 && Array.from({ length: config.drawers }).map((_, di) => (
                                                                <rect key={di} x={6} y={svgH - 8 - (di * 8)} width={svgW - 2} height={6} fill={typeColors[config.type]} fillOpacity={0.2} stroke={typeColors[config.type]} strokeWidth={0.5} />
                                                            ))}
                                                        </svg>
                                                        <span className="text-[8px] text-muted-foreground mt-0.5">{config.height}</span>
                                                        <span className="text-[7px] font-bold uppercase mt-0.5" style={{ color: typeColors[config.type] }}>{config.type} #{idx + 1}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Cabinet Config Cards (Scrollable List) */}
                                <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {[...cabinetConfigs].sort((a, b) => a.order - b.order).map((config, idx) => {
                                        const typeColors = {
                                            base: "border-emerald-500/40 bg-emerald-500/5",
                                            hanging: "border-blue-500/40 bg-blue-500/5",
                                            tall: "border-amber-500/40 bg-amber-500/5",
                                        }
                                        const typeBadgeColors = {
                                            base: "bg-emerald-500 text-white",
                                            hanging: "bg-blue-500 text-white",
                                            tall: "bg-amber-500 text-white",
                                        }
                                        const unitCount = Math.floor((config.linearMeters * 1000) / config.unitWidth)
                                        return (
                                            <div
                                                key={config.id}
                                                className={cn(
                                                    "p-2 rounded-lg border flex items-center justify-between transition-all",
                                                    typeColors[config.type],
                                                    selectedCabinetId === config.id && "ring-1 ring-primary"
                                                )}
                                                onClick={() => setSelectedCabinetId(config.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button onClick={(e) => { e.stopPropagation(); moveCabinetConfig(config.id, "up"); }} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); moveCabinetConfig(config.id, "down"); }} disabled={idx === cabinetConfigs.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded w-fit mb-1", typeBadgeColors[config.type])}>
                                                            {config.type} #{idx + 1}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                            {config.height}×{config.depth}×{config.unitWidth}mm | {unitCount} units
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingCabinetId(config.id); }}
                                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                        title="Edit Details"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeCabinetConfig(config.id); }}
                                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={generatePanelsFromCabinets}
                                >
                                    <Calculator className="w-4 h-4 mr-1" /> Generate Panels
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Panels */}
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold">Panels</h2>
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {panels.length}
                                </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsPanelModalOpen(true)} className="h-8 gap-1.5">
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="text-xs">Manage</span>
                            </Button>
                        </div>

                        {panels.length > 0 ? (
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {panels.slice(0, 10).map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/10 text-[10px]">
                                        <div className="flex flex-col">
                                            <span className="font-bold truncate max-w-[100px]">{p.label || "Untitled Panel"}</span>
                                            <span className="text-muted-foreground">{p.length} × {p.width} {unitLabel}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border/20">×{p.quantity}</span>
                                            <button onClick={() => removePanel(p.id)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {panels.length > 10 && (
                                    <button
                                        onClick={() => setIsPanelModalOpen(true)}
                                        className="w-full py-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors text-center italic"
                                    >
                                        + {panels.length - 10} more panels...
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center border-2 border-dashed border-border/20 rounded-xl bg-muted/10">
                                <p className="text-xs text-muted-foreground mb-3">No panels added yet</p>
                                <Button size="sm" variant="outline" onClick={addPanel} className="h-8">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Panel
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stock Sheets */}
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold">Stock Sheets</h2>
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {stockSheets.length}
                                </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsStockModalOpen(true)} className="h-8 gap-1.5">
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="text-xs">Manage</span>
                            </Button>
                        </div>

                        {stockSheets.length > 0 ? (
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                {stockSheets.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/10 text-[10px]">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{s.length} × {s.width} {unitLabel}</span>
                                            <span className="text-muted-foreground italic">Standard Sheet</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border/20">×{s.quantity}</span>
                                            <button onClick={() => removeStockSheet(s.id)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center border-2 border-dashed border-border/20 rounded-xl bg-muted/10">
                                <p className="text-xs text-muted-foreground mb-3">No stock sheets added</p>
                                <Button size="sm" variant="outline" onClick={addStockSheet} className="h-8">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Stock
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                        <h2 className="text-sm font-semibold mb-3">Options</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground">Cut / blade / kerf ({unitLabel})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-16 p-1.5 text-xs border rounded bg-background text-right"
                                    value={kerfThickness}
                                    onChange={(e) => setKerfThickness(Number(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground">Labels on panels</label>
                                <input
                                    type="checkbox"
                                    checked={labelsOnPanels}
                                    onChange={(e) => setLabelsOnPanels(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground">Consider material</label>
                                <input
                                    type="checkbox"
                                    checked={considerMaterial}
                                    onChange={(e) => setConsiderMaterial(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground">Edge banding</label>
                                <input
                                    type="checkbox"
                                    checked={edgeBanding}
                                    onChange={(e) => setEdgeBanding(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground">Consider grain direction</label>
                                <input
                                    type="checkbox"
                                    checked={grainDirection}
                                    onChange={(e) => setGrainDirection(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Column: Visual Diagram */}
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm h-full overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold">Sheet Layout</h2>
                            {calculated && (
                                <Button variant="outline" size="sm" onClick={() => setIsLayoutModalOpen(true)} className="h-8 gap-1.5 px-3">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-tight">Expand</span>
                                </Button>
                            )}
                        </div>

                        {!calculated ? (
                            <div className="flex-1 flex items-center justify-center min-h-[400px] text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/5">
                                <div className="text-center p-6">
                                    <Calculator className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="font-medium">Ready for calculation</p>
                                    <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest">Awaiting data...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                {/* Compact Summary */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                        <p className="text-[9px] font-bold text-primary uppercase opacity-60 mb-0.5">Sheets Used</p>
                                        <p className="text-2xl font-black text-primary">{usedSheets}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase opacity-60 mb-0.5">Efficiencies</p>
                                        <p className="text-2xl font-black text-emerald-600">{100 - (stats.wastePercent || 0)}%</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {Array.from({ length: usedSheets }).map((_, sheetIdx) => {
                                        const sheetPanels = placements.filter((p) => p.sheetIndex === sheetIdx)
                                        return (
                                            <div
                                                key={sheetIdx}
                                                className="group p-3 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer"
                                                onClick={() => setIsLayoutModalOpen(true)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded shadow-sm">Sheet {sheetIdx + 1}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{sheetPanels.length} Panels</span>
                                                    </div>
                                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors opacity-40" />
                                                </div>
                                                <div className="mt-2 text-[10px] font-mono text-muted-foreground line-clamp-1 opacity-70">
                                                    {sheetPanels.map(p => {
                                                        const pData = panels.find(pl => pl.id === p.panelId.split('-')[0])
                                                        return pData?.label || "Panel"
                                                    }).join(", ")}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="secondary"
                                    className="w-full h-12 rounded-xl font-bold uppercase tracking-tight gap-2 shadow-sm border-t mt-auto"
                                    onClick={() => setIsLayoutModalOpen(true)}
                                >
                                    <Eye className="w-4 h-4 text-primary" />
                                    View Full Diagrams
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Statistics */}
                <div className="space-y-4">
                    {/* Global Statistics */}
                    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="text-sm font-bold mb-5 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                            Optimization Metrics
                        </h2>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-muted/40 rounded-xl border border-border/20">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Utilization</p>
                                <p className="text-xl font-black text-primary">{100 - (stats.wastePercent || 0)}%</p>
                            </div>
                            <div className="p-3 bg-muted/40 rounded-xl border border-border/20">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Waste</p>
                                <p className="text-xl font-black text-destructive">{stats.wastePercent || 0}%</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-2 border-b border-border/20">
                                <span className="text-muted-foreground font-medium">Sheets Used</span>
                                <span className="font-bold text-sm">{stats.usedSheets}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/20">
                                <span className="text-muted-foreground font-medium">Used Area</span>
                                <span className="font-bold">{Number(stats.totalUsedArea).toLocaleString()} <span className="text-[10px] font-normal opacity-60 uppercase">{unitLabel}²</span></span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/20">
                                <span className="text-muted-foreground font-medium">Cut Operations</span>
                                <span className="font-bold">{stats.totalCuts}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground font-medium">Linear Cut Length</span>
                                <span className="font-bold">{Number(stats.cutLength).toLocaleString()} <span className="text-[10px] font-normal opacity-60 uppercase">{unitLabel}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Cuts Table */}
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm flex flex-col max-h-[400px]">
                        <h2 className="text-sm font-semibold mb-3">Cuts Breakdown</h2>
                        {cutsData.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-8">
                                No layout generated
                            </div>
                        ) : (
                            <div className="overflow-auto border rounded-lg">
                                <table className="w-full text-[10px] border-collapse">
                                    <thead className="bg-muted/50 border-b sticky top-0">
                                        <tr>
                                            <th className="p-2 text-left font-semibold">#</th>
                                            <th className="p-2 text-left font-semibold">Size ({unitLabel})</th>
                                            <th className="p-2 text-left font-semibold text-muted-foreground">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {cutsData.map((c, idx) => (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-2 text-muted-foreground">{idx + 1}</td>
                                                <td className="p-2 font-mono font-medium">{c.cut}</td>
                                                <td className="p-2 text-muted-foreground">{c.result}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Edit Cabinet Modal */}
            {editingCabinetId && (() => {
                const config = cabinetConfigs.find(c => c.id === editingCabinetId);
                if (!config) return null;
                const breakdown = getMaterialsBreakdown(config);
                if (!breakdown) return null;
                const typeColors = {
                    base: "border-emerald-500",
                    hanging: "border-blue-500",
                    tall: "border-amber-500",
                };
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className={cn("bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 shadow-2xl p-6 relative flex flex-col gap-6 scale-in-95 animate-in zoom-in-95 duration-200", typeColors[config.type])}>
                            <div className="flex items-center justify-between sticky top-0 bg-card py-2 z-10 border-b border-border/20 mb-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold uppercase tracking-tight">{config.type} Cabinet Details</h2>
                                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">#{config.id.slice(0, 8)}</span>
                                </div>
                                <button onClick={() => setEditingCabinetId(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                                {/* Left Side: Configuration */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                            <div className="w-1 h-3 bg-primary rounded-full"></div>
                                            Dimensions
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Height (mm)</label>
                                                <input type="number" className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20" value={config.height} onChange={(e) => updateCabinetConfig(config.id, "height", Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Depth (mm)</label>
                                                <input type="number" className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20" value={config.depth} onChange={(e) => updateCabinetConfig(config.id, "depth", Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Unit Width (mm)</label>
                                                <input type="number" className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20" value={config.unitWidth} onChange={(e) => updateCabinetConfig(config.id, "unitWidth", Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Linear Meters (m)</label>
                                                <input type="number" step="0.1" className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20" value={config.linearMeters} onChange={(e) => updateCabinetConfig(config.id, "linearMeters", Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                            <div className="w-1 h-3 bg-primary rounded-full"></div>
                                            Components
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Doors</label>
                                                <select className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20" value={config.doorsPerUnit} onChange={(e) => updateCabinetConfig(config.id, "doorsPerUnit", Number(e.target.value) as 1 | 2)}>
                                                    <option value={1}>1 Door</option>
                                                    <option value={2}>2 Doors</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Shelves</label>
                                                <input type="number" min={0} max={10} className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20" value={config.shelves} onChange={(e) => updateCabinetConfig(config.id, "shelves", Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Drawers</label>
                                                <input type="number" min={0} max={5} className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20" value={config.drawers} onChange={(e) => updateCabinetConfig(config.id, "drawers", Number(e.target.value))} disabled={config.type === "hanging"} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Materials Breakdown */}
                                <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold uppercase text-primary">Materials Summary</h3>
                                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{breakdown.unitCount} Total Units</span>
                                    </div>

                                    <div className="space-y-4 text-[11px]">
                                        <div>
                                            <p className="font-bold text-muted-foreground uppercase mb-2">Panels (Per Unit)</p>
                                            <div className="space-y-1">
                                                {breakdown.panels.map((p, i) => (
                                                    <div key={i} className="flex justify-between items-center py-1 border-b border-border/5">
                                                        <span>{p.name} ({p.qty}x)</span>
                                                        <span className="font-mono text-muted-foreground">{p.l}×{p.w}mm</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                            <div>
                                                <p className="font-bold text-muted-foreground uppercase mb-1">Hardware</p>
                                                <div className="space-y-0.5 text-muted-foreground">
                                                    <p>Hinges: {breakdown.hardware.hinges} pr</p>
                                                    <p>Handles: {breakdown.hardware.doorHandles + breakdown.hardware.drawerHandles}</p>
                                                    <p>Slides: {breakdown.hardware.drawerSlides} sets</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-muted-foreground uppercase mb-1">Fasteners</p>
                                                <div className="space-y-0.5 text-muted-foreground">
                                                    <p>Confirmat: {breakdown.fasteners.confirmatScrews}</p>
                                                    <p>Cam Locks: {breakdown.fasteners.camLocks}</p>
                                                    <p>Nails: {breakdown.fasteners.backPanelNails}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-primary/20">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-medium">Total Edge Banding</span>
                                                <span className="font-black text-primary">{(breakdown.totalEdgeBand * breakdown.unitCount).toFixed(2)} LM</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border/20">
                                <Button onClick={() => setEditingCabinetId(null)} className="rounded-xl px-8 h-11 font-bold">
                                    Done
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* Panel Manager Modal */}
            {isPanelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col scale-in-95 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-border/20">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold uppercase tracking-tight">Manage Panels</h2>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    {panels.length} Total
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={addPanel} className="h-9 gap-2">
                                    <Plus className="w-4 h-4" />
                                    <span>Add Panel</span>
                                </Button>
                                <button onClick={() => setIsPanelModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {panels.length > 0 ? (
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 bg-card z-10">
                                        <tr className="border-b border-border/20 text-[10px] text-muted-foreground uppercase font-bold text-left">
                                            <th className="pb-3 px-2 font-black">#</th>
                                            <th className="pb-3 px-2">Label</th>
                                            <th className="pb-3 px-2">Length ({unitLabel})</th>
                                            <th className="pb-3 px-2">Width ({unitLabel})</th>
                                            <th className="pb-3 px-2">Quantity</th>
                                            <th className="pb-3 px-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {panels.map((p, idx) => (
                                            <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="py-2 px-2 text-[10px] font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        className="w-full h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs"
                                                        value={p.label || ""}
                                                        onChange={(e) => updatePanel(p.id, "label", e.target.value)}
                                                        placeholder="e.g. Side Panel"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        className="w-full h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-mono"
                                                        value={p.length || ""}
                                                        onChange={(e) => updatePanel(p.id, "length", Number(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        className="w-full h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-mono"
                                                        value={p.width || ""}
                                                        onChange={(e) => updatePanel(p.id, "width", Number(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        className="w-24 h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-bold"
                                                        value={p.quantity || ""}
                                                        onChange={(e) => updatePanel(p.id, "quantity", Number(e.target.value) || 1)}
                                                        min={1}
                                                    />
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <button
                                                        onClick={() => removePanel(p.id)}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-medium">No panels listed</p>
                                    <p className="text-xs">Click "Add Panel" to begin</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border/20 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground italic">
                            <span>* All changes are saved automatically</span>
                            <Button onClick={() => setIsPanelModalOpen(false)} className="rounded-xl px-10 h-11 font-bold">
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Stock Manager Modal */}
            {isStockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col scale-in-95 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-border/20">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold uppercase tracking-tight">Stock Sheets</h2>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    {stockSheets.length} Total
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={addStockSheet} className="h-9 gap-2">
                                    <Plus className="w-4 h-4" />
                                    <span>Add Stock</span>
                                </Button>
                                <button onClick={() => setIsStockModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {stockSheets.length > 0 ? (
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 bg-card z-10">
                                        <tr className="border-b border-border/20 text-[10px] text-muted-foreground uppercase font-bold text-left">
                                            <th className="pb-3 px-2 font-black">#</th>
                                            <th className="pb-3 px-2">Length ({unitLabel})</th>
                                            <th className="pb-3 px-2">Width ({unitLabel})</th>
                                            <th className="pb-3 px-2">Quantity</th>
                                            <th className="pb-3 px-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {stockSheets.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="py-2 px-2 text-[10px] font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        className="w-full h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-mono"
                                                        value={s.length || ""}
                                                        onChange={(e) => updateStockSheet(s.id, "length", Number(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        className="w-full h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-mono"
                                                        value={s.width || ""}
                                                        onChange={(e) => updateStockSheet(s.id, "width", Number(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        className="w-24 h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-bold"
                                                        value={s.quantity || ""}
                                                        onChange={(e) => updateStockSheet(s.id, "quantity", Number(e.target.value) || 1)}
                                                        min={1}
                                                    />
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <button
                                                        onClick={() => removeStockSheet(s.id)}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-medium">No stock sheets listed</p>
                                    <p className="text-xs">Click "Add Stock" to begin</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border/20 bg-muted/20 flex justify-end">
                            <Button onClick={() => setIsStockModalOpen(false)} className="rounded-xl px-10 h-11 font-bold">
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Sheet Layout Detailed View Modal */}
            {isLayoutModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-3xl border-2 shadow-2xl flex flex-col scale-in-95 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border/20 bg-muted/30">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary rounded-xl">
                                        <Eye className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Detailed Sheet Layouts</h2>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        {usedSheets} Sheets Required
                                    </span>
                                    <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                        {100 - (stats.wastePercent || 0)}% Avg. Utilization
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <button
                                    onClick={() => setIsLayoutModalOpen(false)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors group"
                                >
                                    <X className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                                </button>
                                <div className="flex gap-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Primary Rips</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-1 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Secondary Cuts</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body: Scrollable Diagrams */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-16 custom-scrollbar bg-muted/5">
                            {Array.from({ length: usedSheets }).map((_, sheetIdx) => {
                                const stock = stockSheets[0]
                                const sheetPanels = placements.filter((p) => p.sheetIndex === sheetIdx)
                                const levels = sheetLevels[sheetIdx] || []

                                // Calculate sheet utilization
                                const sheetUsedArea = sheetPanels.reduce((sum, p) => sum + (p.length * p.width), 0)
                                const sheetTotalArea = (stock.length || 0) * (stock.width || 0)
                                const sheetUtilization = sheetTotalArea > 0 ? Math.round((sheetUsedArea / sheetTotalArea) * 100) : 0

                                // Scale to fit width but maintain aspect ratio
                                const svgWidth = 1200
                                const svgHeight = (stock.width / stock.length) * svgWidth
                                const scale = svgWidth / stock.length

                                return (
                                    <div
                                        key={sheetIdx}
                                        className="animate-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                                        style={{ animationDelay: `${sheetIdx * 100}ms` }}
                                    >
                                        <div className="flex items-end justify-between mb-6 px-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black bg-primary text-primary-foreground px-4 py-1 rounded-xl shadow-lg shadow-primary/20">
                                                        SHEET {sheetIdx + 1}
                                                    </span>
                                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-border/40 pl-3">
                                                        {stock.length}{unitLabel} × {stock.width}{unitLabel}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-6">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-60">Utilization</p>
                                                    <p className="text-xl font-black text-emerald-600">{sheetUtilization}%</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-60">Panels</p>
                                                    <p className="text-xl font-black text-primary">{sheetPanels.length}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative overflow-hidden rounded-3xl shadow-2xl border-4 border-white bg-white group/sheet ring-1 ring-border/20">
                                            <svg
                                                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                                className="w-full bg-[#fafafa] transition-transform duration-700"
                                                preserveAspectRatio="xMidYMid meet"
                                            >
                                                <defs>
                                                    <pattern id={`mod-waste-hatch-${sheetIdx}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                                        <line x1="0" y1="0" x2="0" y2="12" stroke="#f1f5f9" strokeWidth="3" />
                                                    </pattern>
                                                    <marker id="mod-arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                                                    </marker>
                                                </defs>

                                                {/* Sheet background and waste indicator */}
                                                <rect
                                                    x={0}
                                                    y={0}
                                                    width={svgWidth}
                                                    height={svgHeight}
                                                    fill={`url(#mod-waste-hatch-${sheetIdx})`}
                                                    stroke="#e2e8f0"
                                                    strokeWidth={2}
                                                />

                                                {/* Primary Cut Lines (Horizontal - Levels) */}
                                                {levels.map((lvl, lIdx) => (
                                                    <g key={`mod-h-${lIdx}`}>
                                                        <line
                                                            x1={0}
                                                            y1={(lvl.y + lvl.h) * scale}
                                                            x2={svgWidth}
                                                            y2={(lvl.y + lvl.h) * scale}
                                                            stroke="#3b82f6"
                                                            strokeWidth={2.5}
                                                            strokeDasharray="10 5"
                                                            opacity={0.6}
                                                        />
                                                        <text
                                                            x={15}
                                                            y={(lvl.y + lvl.h) * scale - 8}
                                                            fontSize="14"
                                                            fontWeight="800"
                                                            fill="#3b82f6"
                                                            className="select-none uppercase tracking-tighter"
                                                        >
                                                            RIP {lIdx + 1}: {Math.round(lvl.h)} {unitLabel}
                                                        </text>
                                                    </g>
                                                ))}

                                                {/* Placed panels */}
                                                {sheetPanels.map((p, idx) => {
                                                    const colors = ["#eff6ff", "#f0fdf4", "#fffbeb", "#fef2f2", "#faf5ff", "#f0fdfa"]
                                                    const borderColors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"]
                                                    const textColors = ["#1e40af", "#166534", "#92400e", "#991b1b", "#6b21a8", "#0f766e"]

                                                    const actualW = p.length - kerfThickness
                                                    const actualH = p.width - kerfThickness

                                                    // IMPORTANT: Match panel label using base ID (removing -0, -1 suffix)
                                                    const baseId = p.panelId.split('-')[0]
                                                    const panelData = panels.find(pl => pl.id === baseId)
                                                    const colorIdx = (idx) % colors.length

                                                    return (
                                                        <g key={idx} className="hover:opacity-95 transition-all cursor-default group/panel">
                                                            <rect
                                                                x={p.x * scale}
                                                                y={p.y * scale}
                                                                width={actualW * scale}
                                                                height={actualH * scale}
                                                                fill={colors[colorIdx]}
                                                                stroke={borderColors[colorIdx]}
                                                                strokeWidth={2.5}
                                                                rx={4}
                                                                className="transition-all duration-300 group-hover/panel:shadow-inner"
                                                            />

                                                            {/* Secondary Cut Lines (Internal to each level) */}
                                                            <line
                                                                x1={(p.x + actualW) * scale}
                                                                y1={p.y * scale}
                                                                x2={(p.x + actualW) * scale}
                                                                y2={(p.y + actualH) * scale}
                                                                stroke="#ef4444"
                                                                strokeWidth={2}
                                                                strokeDasharray="6 3"
                                                                opacity={0.7}
                                                                className="group-hover/panel:opacity-100 transition-opacity"
                                                            />

                                                            {/* Panel Label & Dimensions */}
                                                            <foreignObject
                                                                x={p.x * scale + 8}
                                                                y={p.y * scale + 8}
                                                                width={actualW * scale - 16}
                                                                height={actualH * scale - 16}
                                                            >
                                                                <div className="h-full flex flex-col justify-center items-center text-center overflow-hidden">
                                                                    <p
                                                                        style={{ color: textColors[colorIdx] }}
                                                                        className="font-black text-sm uppercase tracking-tight leading-none mb-1 truncate w-full"
                                                                    >
                                                                        {panelData?.label || `P-${idx + 1}`}
                                                                    </p>
                                                                    <p
                                                                        style={{ color: textColors[colorIdx] }}
                                                                        className="font-mono text-[10px] font-bold opacity-60 whitespace-nowrap"
                                                                    >
                                                                        {Math.round(actualW)}×{Math.round(actualH)}
                                                                    </p>
                                                                </div>
                                                            </foreignObject>
                                                        </g>
                                                    )
                                                })}
                                            </svg>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-border/20 bg-muted/30 flex items-center justify-between">
                            <div className="flex gap-10">
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">Stock Efficiency</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-3xl font-black text-emerald-600">{100 - (stats.wastePercent || 0)}%</p>
                                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${100 - (stats.wastePercent || 0)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">Production Count</p>
                                    <p className="text-3xl font-black text-primary">{usedSheets} <span className="text-sm font-bold opacity-60 uppercase">Sheets</span></p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setIsLayoutModalOpen(false)}
                                className="rounded-2xl px-12 h-14 font-black uppercase tracking-tight text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
