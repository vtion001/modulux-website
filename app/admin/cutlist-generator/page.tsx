"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, Trash2, Calculator, Download, RotateCcw, Settings, ChevronDown, ChevronUp, GripVertical, Pencil, X, Eye, Upload, Printer, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AIPlanParser } from "@/components/admin/ai-plan-parser"
import { supabase } from "@/lib/supabase"
import { Save, FolderOpen, Loader2 } from "lucide-react"


interface Panel {
    id: string
    length: number
    width: number
    quantity: number
    label?: string
    materialGroup?: "carcass" | "doors" | "backing"
    stockSheetId?: string
}

interface StockSheet {
    id: string
    length: number
    width: number
    quantity: number
    thickness?: number
    label?: string
    materialGroup?: "carcass" | "doors" | "backing" | "general"
}

interface PlacedPanel {
    panelId: string
    sheetIndex: number
    x: number
    y: number
    length: number
    width: number
    rotated: boolean
    materialGroup?: "carcass" | "doors" | "backing"
}

interface CutResult {
    panel: string
    cut: string
    result: string
}

interface MaterialConfig {
    stockSheetId: string
    label: string
}

interface CabinetMaterials {
    carcass: MaterialConfig | null
    doors: MaterialConfig | null
    backing: MaterialConfig | null
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
    materials?: CabinetMaterials
}

interface CabinetTypeDefaults {
    height: number
    depth: number
    width: number
    doorsPerUnit: 1 | 2
    shelves: number
    drawers: number
    materials?: CabinetMaterials
}

// Default cabinet dimensions (mm)
const CABINET_DEFAULTS: Record<"base" | "hanging" | "tall", CabinetTypeDefaults> = {
    base: { height: 720, depth: 600, width: 600, doorsPerUnit: 2, shelves: 1, drawers: 0, materials: { carcass: null, doors: null, backing: null } },
    hanging: { height: 720, depth: 350, width: 600, doorsPerUnit: 2, shelves: 2, drawers: 0, materials: { carcass: null, doors: null, backing: null } },
    tall: { height: 2100, depth: 600, width: 600, doorsPerUnit: 2, shelves: 4, drawers: 0, materials: { carcass: null, doors: null, backing: null } },
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
    const [showReportPreview, setShowReportPreview] = useState(false)
    const [placements, setPlacements] = useState<PlacedPanel[]>([])
    const [usedSheets, setUsedSheets] = useState(0)
    const [sheetLevels, setSheetLevels] = useState<{ y: number; h: number; xUsed: number }[][]>([])
    const [sheetsMetadata, setSheetsMetadata] = useState<{ width: number; height: number; materialGroup?: string; label?: string }[]>([])

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
    const [showBOMModal, setShowBOMModal] = useState(false)

    // Cabinet type defaults (configurable, persisted to localStorage)
    const [cabinetTypeDefaults, setCabinetTypeDefaults] = useState<Record<"base" | "hanging" | "tall", CabinetTypeDefaults>>(CABINET_DEFAULTS)
    const [settingsModalType, setSettingsModalType] = useState<"base" | "hanging" | "tall" | null>(null)
    const [aiParserOpen, setAiParserOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [projectId, setProjectId] = useState<string | null>(null)
    const [projectName, setProjectName] = useState("New Project")
    const [isEditingName, setIsEditingName] = useState(false)
    const [savedProjects, setSavedProjects] = useState<Array<{ id: string; name: string; updated_at: string; metrics: any }>>([])
    const [cutsTab, setCutsTab] = useState<"cuts" | "projects">("cuts")

    // Load all saved projects from Supabase
    const loadSavedProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('cutlist_projects')
                .select('id, name, updated_at, metrics')
                .order('updated_at', { ascending: false })
            if (error) throw error
            setSavedProjects(data || [])
        } catch (error: any) {
            console.error("Error loading projects:", error)
        }
    }

    // Start a new project (reset state)
    const startNewProject = () => {
        setProjectId(null)
        setProjectName("New Project")
        setCabinetConfigs([])
        setPanels([])
        setCalculated(false)
        setPlacements([])
        setUsedSheets(0)
        setSheetLevels([])
        setSheetsMetadata([])
        // Clear URL param
        const url = new URL(window.location.href)
        url.searchParams.delete('projectId')
        window.history.replaceState({}, '', url.toString())
        toast.success("Started new project")
    }

    // Load Project from Supabase
    const loadProject = async (id: string) => {
        try {
            const { data: project, error: projError } = await supabase
                .from('cutlist_projects')
                .select('*, cutlist_cabinet_configs(*), cutlist_results(*)')
                .eq('id', id)
                .single()


            if (projError) throw projError

            if (project) {
                setProjectId(project.id)
                setProjectName(project.name)
                setUnit(project.units as any)
                setKerfThickness(project.options.kerf)
                setLabelsOnPanels(project.options.showLabels)
                setConsiderMaterial(project.options.considerMaterial)
                setEdgeBanding(project.options.edgeBanding)
                setGrainDirection(project.options.considerGrain)

                if (project.options.cabinetDefaults) {
                    setCabinetTypeDefaults(project.options.cabinetDefaults)
                }

                // Stock sheets are now global and loaded separately


                if (project.cutlist_cabinet_configs?.length) {
                    setCabinetConfigs(project.cutlist_cabinet_configs.map((c: any) => ({
                        id: c.id,
                        type: c.type,
                        linearMeters: (c.width * c.quantity) / 1000,
                        unitWidth: c.width,
                        height: c.height,
                        depth: c.depth,
                        doorsPerUnit: c.doors,
                        shelves: c.shelves,
                        drawers: c.drawers,
                        materials: c.materials,
                        order: c.order_index || c.order || 0
                    })))
                }

                if (project.cutlist_results?.[0]) {
                    setSheetsMetadata(project.cutlist_results[0].sheets_metadata)
                    // Note: We don't restore placements here as they are temporary and usually recalculated 
                    // but we could if we added a placements field to cutlist_results
                }
            }
        } catch (error: any) {
            console.error("Load Error:", error)
            toast.error(`Error loading project: ${error.message}`)
        }
    }

    // Load Global Stock Sheets
    const loadStockSheets = async () => {
        try {
            const { data, error } = await supabase
                .from('cutlist_stock_sheets')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) throw error

            if (data?.length) {
                setStockSheets(data.map((s: any) => ({
                    id: s.id,
                    length: s.height,
                    width: s.width,
                    quantity: s.quantity,
                    thickness: s.thickness,
                    label: s.label,
                    materialGroup: s.material_group
                })))
            }
        } catch (error: any) {
            console.error("Stock Load Error:", error)
        }
    }


    // Load defaults and initial project
    useEffect(() => {
        const saved = localStorage.getItem("cabinetTypeDefaults")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setCabinetTypeDefaults({ ...CABINET_DEFAULTS, ...parsed })
            } catch { /* ignore */ }
        }

        // Check for project ID in URL
        const params = new URLSearchParams(window.location.search)
        const id = params.get('projectId')
        if (id) {
            loadProject(id)
        }


        // Load global parameters
        loadStockSheets()
        loadSavedProjects()
    }, [])


    // Save defaults to localStorage when changed
    const updateTypeDefaults = (type: "base" | "hanging" | "tall", field: keyof CabinetTypeDefaults, value: any) => {
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
    const updateStockSheet = (id: string, field: keyof StockSheet, value: number | string) => {
        setStockSheets((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        )
    }

    // Print Report Function - Opens new window for reliable PDF printing
    const handlePrintReport = () => {
        const reportElement = document.getElementById('production-report-print');
        if (!reportElement) {
            toast.error("Report not found. Please switch to Preview Document first.");
            return;
        }

        // Clone the report content
        const reportContent = reportElement.querySelector('div')?.innerHTML;
        if (!reportContent) {
            toast.error("Report content not found.");
            return;
        }

        // Open a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        if (!printWindow) {
            toast.error("Could not open print window. Please allow popups.");
            return;
        }

        // Write the print document with ModuLux brand colors
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ModuLux Production Report</title>
                <style>
                    /* === PAGE SETUP === */
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    
                    /* === RESET & BASE === */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    html, body {
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #ffffff;
                        color: #1e3a2e;
                        line-height: 1.5;
                        font-size: 14px;
                    }
                    
                    .report-container {
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    
                    /* === MODULUX BRAND COLORS === */
                    /* Primary: Dark Forest Green #1e3a2e */
                    /* Secondary: Copper/Bronze #b8860b */
                    /* Accent: Light Copper #cd853f */
                    /* Text: #1f2937 */
                    
                    .text-primary { color: #1e3a2e !important; }
                    .text-secondary { color: #b8860b !important; }
                    .text-accent { color: #cd853f !important; }
                    .text-white { color: #ffffff !important; }
                    .text-muted-foreground { color: #6b7280 !important; }
                    
                    .bg-primary { background-color: #1e3a2e !important; }
                    .bg-secondary { background-color: #b8860b !important; }
                    .bg-accent { background-color: #cd853f !important; }
                    .bg-white { background-color: #ffffff !important; }
                    
                    /* Background opacity variants */
                    .bg-primary\\/\\[0\\.01\\] { background-color: rgba(30, 58, 46, 0.01) !important; }
                    .bg-primary\\/\\[0\\.02\\] { background-color: rgba(30, 58, 46, 0.02) !important; }
                    .bg-primary\\/5 { background-color: rgba(30, 58, 46, 0.05) !important; }
                    .bg-primary\\/10 { background-color: rgba(30, 58, 46, 0.1) !important; }
                    .bg-secondary\\/\\[0\\.02\\] { background-color: rgba(184, 134, 11, 0.02) !important; }
                    .bg-secondary\\/30 { background-color: rgba(184, 134, 11, 0.3) !important; }
                    .bg-white\\/50 { background-color: rgba(255, 255, 255, 0.5) !important; }
                    
                    /* Status colors */
                    .bg-emerald-500 { background-color: #10b981 !important; }
                    .bg-blue-500 { background-color: #3b82f6 !important; }
                    .bg-amber-500 { background-color: #f59e0b !important; }
                    
                    /* === TYPOGRAPHY === */
                    .font-black { font-weight: 900 !important; }
                    .font-bold { font-weight: 700 !important; }
                    .font-medium { font-weight: 500 !important; }
                    .font-mono { font-family: ui-monospace, SFMono-Regular, monospace !important; }
                    
                    .uppercase { text-transform: uppercase !important; }
                    .italic { font-style: italic !important; }
                    .not-italic { font-style: normal !important; }
                    
                    .tracking-tight { letter-spacing: -0.025em !important; }
                    .tracking-tighter { letter-spacing: -0.05em !important; }
                    .tracking-widest { letter-spacing: 0.1em !important; }
                    .tracking-\\[0\\.2em\\] { letter-spacing: 0.2em !important; }
                    .tracking-\\[0\\.3em\\] { letter-spacing: 0.3em !important; }
                    .tracking-\\[0\\.4em\\] { letter-spacing: 0.4em !important; }
                    .tracking-\\[0\\.5em\\] { letter-spacing: 0.5em !important; }
                    
                    .leading-tight { line-height: 1.25 !important; }
                    
                    .text-\\[8px\\] { font-size: 8px !important; }
                    .text-\\[9px\\] { font-size: 9px !important; }
                    .text-\\[10px\\] { font-size: 10px !important; }
                    .text-\\[11px\\] { font-size: 11px !important; }
                    .text-xs { font-size: 12px !important; }
                    .text-sm { font-size: 14px !important; }
                    .text-base { font-size: 16px !important; }
                    .text-lg { font-size: 18px !important; }
                    .text-xl { font-size: 20px !important; }
                    .text-2xl { font-size: 24px !important; }
                    .text-3xl { font-size: 30px !important; }
                    .text-4xl { font-size: 36px !important; }
                    
                    .opacity-10 { opacity: 0.1 !important; }
                    .opacity-20 { opacity: 0.2 !important; }
                    .opacity-30 { opacity: 0.3 !important; }
                    .opacity-40 { opacity: 0.4 !important; }
                    .opacity-50 { opacity: 0.5 !important; }
                    
                    /* === LAYOUT === */
                    .flex { display: flex !important; }
                    .inline-flex { display: inline-flex !important; }
                    .grid { display: grid !important; }
                    .block { display: block !important; }
                    
                    .flex-col { flex-direction: column !important; }
                    .flex-1 { flex: 1 1 0% !important; }
                    
                    .items-start { align-items: flex-start !important; }
                    .items-center { align-items: center !important; }
                    .items-end { align-items: flex-end !important; }
                    .items-baseline { align-items: baseline !important; }
                    
                    .justify-start { justify-content: flex-start !important; }
                    .justify-center { justify-content: center !important; }
                    .justify-between { justify-content: space-between !important; }
                    .justify-end { justify-content: flex-end !important; }
                    
                    .text-left { text-align: left !important; }
                    .text-center { text-align: center !important; }
                    .text-right { text-align: right !important; }
                    
                    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
                    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                    
                    .gap-1 { gap: 4px !important; }
                    .gap-2 { gap: 8px !important; }
                    .gap-3 { gap: 12px !important; }
                    .gap-4 { gap: 16px !important; }
                    .gap-6 { gap: 24px !important; }
                    .gap-10 { gap: 40px !important; }
                    
                    /* === SPACING === */
                    .p-3 { padding: 12px !important; }
                    .p-4 { padding: 16px !important; }
                    .p-6 { padding: 24px !important; }
                    .p-8 { padding: 32px !important; }
                    .p-16 { padding: 64px !important; }
                    
                    .px-4 { padding-left: 16px !important; padding-right: 16px !important; }
                    .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
                    .pt-8 { padding-top: 32px !important; }
                    .pb-2 { padding-bottom: 8px !important; }
                    .pb-10 { padding-bottom: 40px !important; }
                    
                    .m-0 { margin: 0 !important; }
                    .mx-auto { margin-left: auto !important; margin-right: auto !important; }
                    .mt-1 { margin-top: 4px !important; }
                    .mt-16 { margin-top: 64px !important; }
                    .mb-0\\.5 { margin-bottom: 2px !important; }
                    .mb-1 { margin-bottom: 4px !important; }
                    .mb-2 { margin-bottom: 8px !important; }
                    .mb-4 { margin-bottom: 16px !important; }
                    .mb-6 { margin-bottom: 24px !important; }
                    .mb-10 { margin-bottom: 40px !important; }
                    .mb-12 { margin-bottom: 48px !important; }
                    
                    .space-y-2 > * + * { margin-top: 8px !important; }
                    .space-y-4 > * + * { margin-top: 16px !important; }
                    
                    /* === SIZING === */
                    .w-1 { width: 4px !important; }
                    .w-10 { width: 40px !important; }
                    .w-12 { width: 48px !important; }
                    .w-16 { width: 64px !important; }
                    .w-full { width: 100% !important; }
                    .max-w-\\[800px\\] { max-width: 800px !important; }
                    
                    .h-1 { height: 4px !important; }
                    .h-1\\.5 { height: 6px !important; }
                    .h-3 { height: 12px !important; }
                    .h-6 { height: 24px !important; }
                    .h-10 { height: 40px !important; }
                    .h-12 { height: 48px !important; }
                    .h-full { height: 100% !important; }
                    
                    /* === BORDERS === */
                    .border { border: 1px solid rgba(30, 58, 46, 0.1) !important; }
                    .border-t { border-top: 1px solid rgba(30, 58, 46, 0.1) !important; }
                    .border-b { border-bottom: 1px solid rgba(30, 58, 46, 0.1) !important; }
                    .border-b-\\[3px\\] { border-bottom: 3px solid #1e3a2e !important; }
                    .border-\\[2px\\] { border-width: 2px !important; }
                    
                    .border-primary { border-color: #1e3a2e !important; }
                    .border-primary\\/5 { border-color: rgba(30, 58, 46, 0.05) !important; }
                    .border-primary\\/10 { border-color: rgba(30, 58, 46, 0.1) !important; }
                    .border-primary\\/20 { border-color: rgba(30, 58, 46, 0.2) !important; }
                    .border-secondary\\/10 { border-color: rgba(184, 134, 11, 0.1) !important; }
                    .border-secondary\\/20 { border-color: rgba(184, 134, 11, 0.2) !important; }
                    
                    .border-r-0 { border-right: 0 !important; }
                    .border-l-0 { border-left: 0 !important; }
                    
                    .rounded-full { border-radius: 9999px !important; }
                    .rounded-lg { border-radius: 8px !important; }
                    .rounded-xl { border-radius: 12px !important; }
                    .rounded-2xl { border-radius: 16px !important; }
                    .rounded-l-2xl { border-top-left-radius: 16px !important; border-bottom-left-radius: 16px !important; }
                    .rounded-r-2xl { border-top-right-radius: 16px !important; border-bottom-right-radius: 16px !important; }
                    
                    /* === TABLE STYLING === */
                    table { 
                        width: 100% !important; 
                        border-collapse: collapse !important;
                    }
                    
                    th, td { 
                        padding: 12px 16px !important; 
                        text-align: left !important;
                    }
                    
                    thead { 
                        background-color: #1e3a2e !important; 
                        color: #ffffff !important;
                    }
                    
                    thead th {
                        font-weight: 900 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.1em !important;
                        font-size: 10px !important;
                    }
                    
                    tbody tr { 
                        border-bottom: 1px solid rgba(30, 58, 46, 0.1) !important;
                    }
                    
                    .divide-y > * + * {
                        border-top: 1px solid rgba(30, 58, 46, 0.1) !important;
                    }
                    
                    .divide-primary\\/10 > * + * {
                        border-color: rgba(30, 58, 46, 0.1) !important;
                    }
                    
                    /* === MISC === */
                    .overflow-hidden { overflow: hidden !important; }
                    
                    .shadow-lg, .shadow-xl, .shadow-2xl { 
                        box-shadow: none !important; 
                    }
                    
                    img { 
                        max-width: 100% !important; 
                        height: auto !important;
                    }
                    
                    /* === PAGE BREAK CONTROL === */
                    .avoid-break { 
                        break-inside: avoid !important; 
                        page-break-inside: avoid !important;
                    }
                    
                    /* Ensure sections don't break awkwardly */
                    .mb-12 {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    
                    /* === HEADER BORDER === */
                    .border-b-\\[3px\\].border-primary {
                        border-bottom: 3px solid #1e3a2e !important;
                    }
                    
                    /* === LAST CHILD BORDER REMOVAL === */
                    .last\\:border-0:last-child {
                        border: 0 !important;
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    ${reportContent}
                </div>
                <script>
                    window.onload = function() {
                        // Small delay to ensure styles are applied
                        setTimeout(function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };


    // Cabinet Builder functions

    // Handle AI extracted cabinets
    const handleApplyExtractedCabinets = (extracted: Array<{
        id: string
        type: "base" | "hanging" | "tall"
        height: number
        depth: number
        width: number
        quantity: number
        confidence: number
        location?: string
    }>) => {
        const newConfigs = extracted.map((cab, idx) => ({
            id: crypto.randomUUID(),
            type: cab.type,
            linearMeters: (cab.width * cab.quantity) / 1000, // convert to meters
            unitWidth: cab.width,
            height: cab.height,
            depth: cab.depth,
            doorsPerUnit: cabinetTypeDefaults[cab.type].doorsPerUnit,
            shelves: cabinetTypeDefaults[cab.type].shelves,
            drawers: cabinetTypeDefaults[cab.type].drawers,
            materials: cabinetTypeDefaults[cab.type].materials ? JSON.parse(JSON.stringify(cabinetTypeDefaults[cab.type].materials)) : { carcass: null, doors: null, backing: null },
            order: cabinetConfigs.length + idx
        }))

        setCabinetConfigs(prev => [...prev, ...newConfigs])
        setAiParserOpen(false)
        toast.success(`Added ${newConfigs.length} cabinet${newConfigs.length > 1 ? 's' : ''} from plan`)

        // Auto-save after extracting plan
        setTimeout(() => saveProject(), 500)
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
                materials: defaults.materials ? JSON.parse(JSON.stringify(defaults.materials)) : { carcass: null, doors: null, backing: null },
                order: maxOrder + 1
            },
        ])
    }

    const removeCabinetConfig = (id: string) => {
        setCabinetConfigs((prev) => prev.filter((c) => c.id !== id))
    }

    const updateCabinetConfig = (id: string, field: keyof CabinetConfig, value: number | string | CabinetMaterials) => {
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
            { name: "Left Side", l: config.height, w: config.depth, qty: 1, edgeBand: (config.height + config.depth) * 2 / 1000, materialGroup: "carcass" },
            { name: "Right Side", l: config.height, w: config.depth, qty: 1, edgeBand: (config.height + config.depth) * 2 / 1000, materialGroup: "carcass" },
            { name: "Top", l: config.unitWidth, w: config.depth, qty: 1, edgeBand: config.unitWidth / 1000, materialGroup: "carcass" },
            { name: "Bottom", l: config.unitWidth, w: config.depth, qty: 1, edgeBand: config.unitWidth / 1000, materialGroup: "carcass" },
            { name: "Back", l: config.height, w: config.unitWidth, qty: 1, edgeBand: 0, materialGroup: "backing" },
            ...(config.shelves > 0 ? [{ name: "Shelf", l: shelfWidth, w: shelfDepth, qty: config.shelves, edgeBand: (shelfWidth * config.shelves) / 1000, materialGroup: "carcass" }] : []),
            ...(config.doorsPerUnit > 0 ? [{ name: "Door", l: doorHeight, w: doorWidth, qty: config.doorsPerUnit, edgeBand: ((doorHeight + doorWidth) * 2 * config.doorsPerUnit) / 1000, materialGroup: "doors" }] : []),
            ...(config.drawers > 0 ? [{ name: "Drawer Front", l: drawerFrontHeight, w: config.unitWidth, qty: config.drawers, edgeBand: ((drawerFrontHeight + config.unitWidth) * 2 * config.drawers) / 1000, materialGroup: "doors" }] : []),
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

            const carcassMaterial = config.materials?.carcass
            const doorsMaterial = config.materials?.doors
            const backingMaterial = config.materials?.backing

            // Side Panels (Gables) - 2 per unit - CARCASS
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.height,
                width: config.depth,
                quantity: unitCount * 2,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Side`,
                materialGroup: "carcass",
                stockSheetId: carcassMaterial?.stockSheetId,
            })

            // Top Panel - 1 per unit - CARCASS
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.unitWidth,
                width: config.depth,
                quantity: unitCount,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Top`,
                materialGroup: "carcass",
                stockSheetId: carcassMaterial?.stockSheetId,
            })

            // Bottom Panel - 1 per unit - CARCASS
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.unitWidth,
                width: config.depth,
                quantity: unitCount,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Bottom`,
                materialGroup: "carcass",
                stockSheetId: carcassMaterial?.stockSheetId,
            })

            // Back Panel - 1 per unit - BACKING
            newPanels.push({
                id: crypto.randomUUID(),
                length: config.height,
                width: config.unitWidth,
                quantity: unitCount,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Back`,
                materialGroup: "backing",
                stockSheetId: backingMaterial?.stockSheetId,
            })

            // Shelves - CARCASS
            if (config.shelves > 0) {
                newPanels.push({
                    id: crypto.randomUUID(),
                    length: config.unitWidth - 36, // Account for side panel thickness
                    width: config.depth - 20, // Setback from front
                    quantity: unitCount * config.shelves,
                    label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Shelf`,
                    materialGroup: "carcass",
                    stockSheetId: carcassMaterial?.stockSheetId,
                })
            }

            // Doors - DOORS
            const doorWidth = config.doorsPerUnit === 1 ? config.unitWidth : config.unitWidth / 2
            const doorHeight = config.type === "base" ? config.height - 100 : config.height // Base has kickboard
            newPanels.push({
                id: crypto.randomUUID(),
                length: doorHeight,
                width: doorWidth,
                quantity: unitCount * config.doorsPerUnit,
                label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Door`,
                materialGroup: "doors",
                stockSheetId: doorsMaterial?.stockSheetId,
            })

            // Drawer Fronts (for base and tall only) - DOORS
            if ((config.type === "base" || config.type === "tall") && config.drawers > 0) {
                newPanels.push({
                    id: crypto.randomUUID(),
                    length: drawerFrontHeight,
                    width: config.unitWidth,
                    quantity: unitCount * config.drawers,
                    label: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Drawer Front`,
                    materialGroup: "doors",
                    stockSheetId: doorsMaterial?.stockSheetId,
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

    const calculate = () => {
        if (panels.length === 0 || stockSheets.length === 0) {
            toast.error("Add at least one panel and one stock sheet")
            return
        }

        const allPlaced: PlacedPanel[] = []
        const allSheetLevels: { y: number; h: number; xUsed: number }[][] = []
        const allMetadata: { width: number; height: number; materialGroup?: string; label?: string }[] = []
        let currentTotalSheets = 0

        // Group panels by stockSheetId
        const panelGroups: Record<string, Panel[]> = {}
        panels.forEach(p => {
            const sid = (considerMaterial && p.stockSheetId) ? p.stockSheetId : 'default'
            if (!panelGroups[sid]) panelGroups[sid] = []
            panelGroups[sid].push(p)
        })

        for (const sid in panelGroups) {
            const groupPanels = panelGroups[sid]
            const stock = (sid === 'default') ? stockSheets[0] : stockSheets.find(s => s.id === sid) || stockSheets[0]

            if (!stock || stock.length <= 0 || stock.width <= 0) continue

            // Expand panels by quantity
            const expandedPanels: (Panel & { expandedId: string })[] = []
            groupPanels.forEach((p, pIdx) => {
                if (p.length <= 0 || p.width <= 0) return
                for (let i = 0; i < p.quantity; i++) {
                    expandedPanels.push({
                        ...p,
                        expandedId: `${p.id}-${i}`,
                        length: p.length + kerfThickness,
                        width: p.width + kerfThickness,
                        label: p.label || `P${pIdx + 1}`
                    })
                }
            })

            if (expandedPanels.length === 0) continue

            // Sort by area descending
            expandedPanels.sort((a, b) => b.length * b.width - a.length * b.width)

            const sheetW = stock.length
            const sheetH = stock.width
            const groupSheets: { levels: { y: number; h: number; xUsed: number }[] }[] = []

            for (const panel of expandedPanels) {
                let fitted = false
                let pLen = panel.length
                let pWid = panel.width
                let rotated = false

                const tryRotations = grainDirection ? [false] : [false, true]

                for (const rot of tryRotations) {
                    if (rot) {
                        pLen = panel.width
                        pWid = panel.length
                        rotated = true
                    }

                    if (pLen > sheetW || pWid > sheetH) continue

                    // Try existing sheets in this group
                    for (let sIdx = 0; sIdx < groupSheets.length && !fitted; sIdx++) {
                        const sheet = groupSheets[sIdx]
                        for (let lIdx = 0; lIdx < sheet.levels.length && !fitted; lIdx++) {
                            const level = sheet.levels[lIdx]
                            if (pWid <= level.h && level.xUsed + pLen <= sheetW) {
                                allPlaced.push({
                                    panelId: panel.id,
                                    sheetIndex: currentTotalSheets + sIdx,
                                    x: level.xUsed,
                                    y: level.y,
                                    length: pLen,
                                    width: pWid,
                                    rotated,
                                    materialGroup: panel.materialGroup
                                })
                                level.xUsed += pLen
                                fitted = true
                            }
                        }

                        if (!fitted) {
                            const usedHeight = sheet.levels.reduce((sum, l) => Math.max(sum, l.y + l.h), 0)
                            if (usedHeight + pWid <= sheetH && pLen <= sheetW) {
                                sheet.levels.push({ y: usedHeight, h: pWid, xUsed: pLen })
                                allPlaced.push({
                                    panelId: panel.id,
                                    sheetIndex: currentTotalSheets + sIdx,
                                    x: 0,
                                    y: usedHeight,
                                    length: pLen,
                                    width: pWid,
                                    rotated,
                                    materialGroup: panel.materialGroup
                                })
                                fitted = true
                            }
                        }
                    }
                    if (fitted) break
                }

                if (!fitted) {
                    if (pLen > sheetW || pWid > sheetH) {
                        toast.error(`Panel ${panel.label} is too large for the stock sheet`)
                        continue
                    }
                    const newSheetIdx = groupSheets.length
                    groupSheets.push({ levels: [{ y: 0, h: pWid, xUsed: pLen }] })
                    allPlaced.push({
                        panelId: panel.id,
                        sheetIndex: currentTotalSheets + newSheetIdx,
                        x: 0,
                        y: 0,
                        length: pLen,
                        width: pWid,
                        rotated,
                        materialGroup: panel.materialGroup
                    })
                }
            }

            allSheetLevels.push(...groupSheets.map(s => s.levels))
            groupSheets.forEach(() => {
                allMetadata.push({
                    width: stock.length,
                    height: stock.width,
                    materialGroup: groupPanels[0]?.materialGroup,
                    label: stock.label || `${stock.length}×${stock.width}mm`
                })
            })
            currentTotalSheets += groupSheets.length
        }

        setPlacements(allPlaced)
        setUsedSheets(currentTotalSheets)
        setSheetLevels(allSheetLevels)
        setSheetsMetadata(allMetadata)
        setCalculated(true)
        toast.success(`Optimized layout: ${currentTotalSheets} sheet(s) required across materials`)
    }

    // Statistics
    const stats = useMemo(() => {
        if (!calculated || placements.length === 0 || sheetsMetadata.length === 0) {
            return { usedSheets: 0, totalUsedArea: 0, totalWastedArea: 0, totalCuts: 0, cutLength: 0 }
        }

        const totalSheetArea = sheetsMetadata.reduce((sum, s) => sum + s.width * s.height, 0)
        const usedArea = placements.reduce((sum, p) => sum + p.length * p.width, 0)
        const wastedArea = totalSheetArea - usedArea
        const totalCuts = placements.length * 2
        const cutLength = placements.reduce((sum, p) => sum + (p.length + p.width) * 2, 0)

        return {
            usedSheets: sheetsMetadata.length,
            totalUsedArea: Math.round(usedArea * 100) / 100,
            totalWastedArea: Math.round(wastedArea * 100) / 100,
            wastePercent: totalSheetArea > 0 ? Math.round((wastedArea / totalSheetArea) * 100) : 0,
            totalCuts,
            cutLength: Math.round(cutLength * 100) / 100,
        }
    }, [calculated, placements, sheetsMetadata])

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

    const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false)

    const updateProjectName = (name: string) => {
        setProjectName(name)
    }


    // Save Project to Supabase
    const saveProject = async () => {
        setIsSaving(true)
        const activeProjectId = projectId || crypto.randomUUID()

        try {
            // 1. Save Project Core
            const { error: projError } = await supabase
                .from('cutlist_projects')
                .upsert({
                    id: activeProjectId,
                    name: projectName,
                    units: unit,
                    options: {
                        kerf: kerfThickness,
                        showLabels: labelsOnPanels,
                        considerMaterial,
                        edgeBanding,
                        considerGrain: grainDirection,
                        cabinetDefaults: cabinetTypeDefaults
                    },
                    metrics: calculated ? {
                        utilization: 100 - (stats.wastePercent || 0),
                        waste: stats.wastePercent,
                        sheetsUsed: usedSheets,
                        usedArea: stats.totalUsedArea,
                        cutOperations: stats.totalCuts,
                        linearCutLength: stats.cutLength
                    } : null,
                    updated_at: new Date().toISOString()
                })

            if (projError) throw projError

            // 2. Save Stock Sheets (Globally)
            // We use upsert to maintain the global library without breaking foreign key relationships
            if (stockSheets.length > 0) {
                const { error: stockUpsertError } = await supabase
                    .from('cutlist_stock_sheets')
                    .upsert(stockSheets.map(s => ({
                        id: s.id,
                        label: s.label,
                        width: s.width,
                        height: s.length,
                        thickness: s.thickness,
                        quantity: s.quantity,
                        material_group: s.materialGroup
                    })), { onConflict: 'id' })
                if (stockUpsertError) throw stockUpsertError
            }


            // 3. Save Cabinet Configs
            await supabase.from('cutlist_cabinet_configs').delete().eq('project_id', activeProjectId)
            const { error: cabError } = await supabase
                .from('cutlist_cabinet_configs')
                .insert(cabinetConfigs.map(c => ({
                    id: c.id,
                    project_id: activeProjectId,
                    name: `Cabinet ${c.order + 1}`,
                    type: c.type,
                    width: c.unitWidth,
                    height: c.height,
                    depth: c.depth,
                    doors: c.doorsPerUnit,
                    shelves: c.shelves,
                    drawers: c.drawers,
                    quantity: Math.floor((c.linearMeters * 1000) / c.unitWidth),
                    materials: c.materials,
                    order_index: c.order
                })))
            if (cabError) throw cabError

            // 4. Save Panels (Individual/Custom)
            await supabase.from('cutlist_panels').delete().eq('project_id', activeProjectId)
            if (panels.length > 0) {
                const { error: panelError } = await supabase
                    .from('cutlist_panels')
                    .insert(panels.map(p => ({
                        id: p.id,
                        project_id: activeProjectId,
                        name: p.label || 'Untitled Panel',
                        width: p.width,
                        height: p.length,
                        quantity: p.quantity,
                        material_group: p.materialGroup,
                        stock_sheet_id: p.stockSheetId
                    })))
                if (panelError) throw panelError
            }

            // 5. Save Optimization Result
            if (calculated) {
                await supabase.from('cutlist_results').delete().eq('project_id', activeProjectId)
                const { error: resError } = await supabase.from('cutlist_results').insert({
                    id: crypto.randomUUID(),
                    project_id: activeProjectId,
                    sheets_metadata: sheetsMetadata
                })
                if (resError) throw resError
            }

            setProjectId(activeProjectId)

            // Update URL with projectId without reloading
            const url = new URL(window.location.href)
            url.searchParams.set('projectId', activeProjectId)
            window.history.replaceState({}, '', url.toString())

            toast.success("Project saved successfully")
            loadSavedProjects() // Refresh the projects list
        } catch (error: any) {

            console.error("Save Error:", error)
            toast.error(`Error saving project: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
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
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCutsTab("projects")}
                            className="p-3 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/20 transition-all group"
                            title="View Saved Projects"
                        >
                            <FolderOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={startNewProject}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition-all"
                            title="New Project"
                        >
                            <Plus className="w-4 h-4 text-emerald-600" />
                        </button>
                    </div>
                    <div>
                        {isEditingName ? (
                            <input
                                autoFocus
                                className="text-2xl font-bold tracking-tight bg-transparent border-b-2 border-primary/50 outline-none px-1"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                            />
                        ) : (
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {projectName}
                                <button onClick={() => setIsEditingName(true)} className="opacity-30 hover:opacity-100 transition-opacity">
                                    <Pencil className="w-3 h-3" />
                                </button>
                                {projectId && (
                                    <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded opacity-60">{projectId.slice(0, 8)}</span>
                                )}
                            </h1>
                        )}
                        <p className="text-sm text-muted-foreground">Optimize panel layouts on stock sheets</p>
                    </div>
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
                    <Button variant="outline" size="sm" onClick={saveProject} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save
                    </Button>
                    <Button
                        onClick={() => setShowBOMModal(true)}

                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/20"
                    >
                        <Settings className="w-4 h-4 mr-2" /> Process BOM
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
                                {/* Upload Plan Button */}
                                <div className="mb-2">
                                    <Button
                                        onClick={() => setAiParserOpen(true)}
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                    >
                                        <Upload className="w-3 h-3 mr-1" />
                                        Upload Architectural Plan
                                    </Button>
                                </div>

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

                                        <div className="space-y-1.5 pt-2 border-t border-border/20">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-1 h-2 bg-primary/40 rounded-full"></div>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Default Materials</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                    <select
                                                        className="flex-1 p-1 text-[10px] border rounded bg-background outline-none focus:ring-1 focus:ring-primary/20"
                                                        value={cabinetTypeDefaults[settingsModalType].materials?.carcass?.stockSheetId || ""}
                                                        onChange={(e) => {
                                                            const sheet = stockSheets.find(s => s.id === e.target.value)
                                                            const currentMaterials = cabinetTypeDefaults[settingsModalType].materials || { carcass: null, doors: null, backing: null }
                                                            updateTypeDefaults(settingsModalType, "materials", {
                                                                ...currentMaterials,
                                                                carcass: sheet ? { stockSheetId: sheet.id, label: sheet.label || `${sheet.length}×${sheet.width}mm` } : null
                                                            })
                                                        }}
                                                    >
                                                        <option value="">Carcass Material...</option>
                                                        {stockSheets.map(s => <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                                    <select
                                                        className="flex-1 p-1 text-[10px] border rounded bg-background outline-none focus:ring-1 focus:ring-primary/20"
                                                        value={cabinetTypeDefaults[settingsModalType].materials?.doors?.stockSheetId || ""}
                                                        onChange={(e) => {
                                                            const sheet = stockSheets.find(s => s.id === e.target.value)
                                                            const currentMaterials = cabinetTypeDefaults[settingsModalType].materials || { carcass: null, doors: null, backing: null }
                                                            updateTypeDefaults(settingsModalType, "materials", {
                                                                ...currentMaterials,
                                                                doors: sheet ? { stockSheetId: sheet.id, label: sheet.label || `${sheet.length}×${sheet.width}mm` } : null
                                                            })
                                                        }}
                                                    >
                                                        <option value="">Doors Material...</option>
                                                        {stockSheets.map(s => <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                                    <select
                                                        className="flex-1 p-1 text-[10px] border rounded bg-background outline-none focus:ring-1 focus:ring-primary/20"
                                                        value={cabinetTypeDefaults[settingsModalType].materials?.backing?.stockSheetId || ""}
                                                        onChange={(e) => {
                                                            const sheet = stockSheets.find(s => s.id === e.target.value)
                                                            const currentMaterials = cabinetTypeDefaults[settingsModalType].materials || { carcass: null, doors: null, backing: null }
                                                            updateTypeDefaults(settingsModalType, "materials", {
                                                                ...currentMaterials,
                                                                backing: sheet ? { stockSheetId: sheet.id, label: sheet.label || `${sheet.length}×${sheet.width}mm` } : null
                                                            })
                                                        }}
                                                    >
                                                        <option value="">Backing Material...</option>
                                                        {stockSheets.map(s => <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-border/10">
                                            <p className="text-[9px] text-muted-foreground italic">Settings sync to project</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[9px] font-black uppercase text-primary hover:bg-primary/5 px-2 gap-1"
                                                onClick={saveProject}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
                                                Save Config
                                            </Button>
                                        </div>
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
                                            <div className="flex items-center gap-1.5">
                                                {p.materialGroup === "carcass" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]"></span>}
                                                {p.materialGroup === "doors" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.4)]"></span>}
                                                {p.materialGroup === "backing" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)]"></span>}
                                                <span className="font-bold truncate max-w-[100px]">{p.label || "Untitled Panel"}</span>
                                            </div>
                                            <span className="text-muted-foreground ml-3">{p.length} × {p.width} {unitLabel}</span>
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
                                        const meta = sheetsMetadata[sheetIdx]
                                        return (
                                            <div
                                                key={sheetIdx}
                                                className="group p-3 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer"
                                                onClick={() => setIsLayoutModalOpen(true)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded shadow-sm">Sheet {sheetIdx + 1}</span>
                                                            {meta?.materialGroup === "carcass" && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                                                            {meta?.materialGroup === "doors" && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                                            {meta?.materialGroup === "backing" && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{meta?.label || 'Standard Sheet'}</span>
                                                            <span className="text-[8px] opacity-60 uppercase">{sheetPanels.length} Panels</span>
                                                        </div>
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

                    {/* Cuts Table / Saved Projects (Tabbed) */}
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm flex flex-col max-h-[400px]">
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                onClick={() => setCutsTab("cuts")}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase",
                                    cutsTab === "cuts" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Cuts Breakdown
                            </button>
                            <button
                                onClick={() => setCutsTab("projects")}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase",
                                    cutsTab === "projects" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Saved Projects ({savedProjects.length})
                            </button>
                        </div>

                        {cutsTab === "cuts" ? (
                            cutsData.length === 0 ? (
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
                            )
                        ) : (
                            <div className="flex-1 overflow-auto">
                                {savedProjects.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-8">
                                        No saved projects yet
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {savedProjects.map((proj) => (
                                            <div
                                                key={proj.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                    proj.id === projectId ? "border-primary bg-primary/5" : "border-border/40 hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">{proj.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {proj.updated_at ? new Date(proj.updated_at).toLocaleDateString() : "No date"}
                                                        {proj.metrics?.sheetsUsed && ` • ${proj.metrics.sheetsUsed} sheets`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[10px] px-2"
                                                        onClick={() => {
                                                            loadProject(proj.id)
                                                            setCutsTab("cuts")
                                                        }}
                                                        disabled={proj.id === projectId}
                                                    >
                                                        {proj.id === projectId ? "Active" : "Load"}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[10px] px-2 text-destructive hover:bg-destructive/10"
                                                        onClick={async () => {
                                                            if (!confirm(`Delete "${proj.name}"?`)) return
                                                            await supabase.from('cutlist_projects').delete().eq('id', proj.id)
                                                            loadSavedProjects()
                                                            toast.success("Project deleted")
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

                                    <div>
                                        <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                            <div className="w-1 h-3 bg-primary rounded-full"></div>
                                            Materials
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    Carcass (Sides, Top, Bottom, Shelves)
                                                </label>
                                                <select
                                                    className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                                    value={config.materials?.carcass?.stockSheetId || ""}
                                                    onChange={(e) => {
                                                        const sheet = stockSheets.find(s => s.id === e.target.value)
                                                        updateCabinetConfig(config.id, "materials", {
                                                            ...config.materials,
                                                            carcass: sheet ? { stockSheetId: sheet.id, label: sheet.label || `${sheet.length}×${sheet.width}mm` } : null,
                                                            doors: config.materials?.doors || null,
                                                            backing: config.materials?.backing || null,
                                                        } as CabinetMaterials)
                                                    }}
                                                >
                                                    <option value="">Select stock sheet...</option>
                                                    {stockSheets.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    Doors & Drawer Fronts
                                                </label>
                                                <select
                                                    className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                                    value={config.materials?.doors?.stockSheetId || ""}
                                                    onChange={(e) => {
                                                        const sheet = stockSheets.find(s => s.id === e.target.value)
                                                        updateCabinetConfig(config.id, "materials", {
                                                            ...config.materials,
                                                            carcass: config.materials?.carcass || null,
                                                            doors: sheet ? { stockSheetId: sheet.id, label: sheet.label || `${sheet.length}×${sheet.width}mm` } : null,
                                                            backing: config.materials?.backing || null,
                                                        } as CabinetMaterials)
                                                    }}
                                                >
                                                    <option value="">Select stock sheet...</option>
                                                    {stockSheets.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                    Backing
                                                </label>
                                                <select
                                                    className="w-full h-10 px-3 border rounded-xl bg-muted/30 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                                    value={config.materials?.backing?.stockSheetId || ""}
                                                    onChange={(e) => {
                                                        const sheet = stockSheets.find(s => s.id === e.target.value)
                                                        updateCabinetConfig(config.id, "materials", {
                                                            ...config.materials,
                                                            carcass: config.materials?.carcass || null,
                                                            doors: config.materials?.doors || null,
                                                            backing: sheet ? { stockSheetId: sheet.id, label: sheet.label || `${sheet.length}×${sheet.width}mm` } : null,
                                                        } as CabinetMaterials)
                                                    }}
                                                >
                                                    <option value="">Select stock sheet...</option>
                                                    {stockSheets.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}
                                                        </option>
                                                    ))}
                                                </select>
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
                                            <th className="pb-3 px-2">Group</th>
                                            <th className="pb-3 px-2">Stock Sheet</th>
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
                                                        className="w-20 h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-bold"
                                                        value={p.quantity || ""}
                                                        onChange={(e) => updatePanel(p.id, "quantity", Number(e.target.value) || 1)}
                                                        min={1}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <select
                                                        className="h-9 px-2 border rounded-lg bg-transparent outline-none focus:ring-1 focus:ring-primary/30 text-[10px] font-bold uppercase"
                                                        value={p.materialGroup || ""}
                                                        onChange={(e) => updatePanel(p.id, "materialGroup", e.target.value)}
                                                    >
                                                        <option value="">General</option>
                                                        <option value="carcass">Carcass</option>
                                                        <option value="doors">Doors</option>
                                                        <option value="backing">Backing</option>
                                                    </select>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <select
                                                        className="w-full h-9 px-2 border rounded-lg bg-transparent outline-none focus:ring-1 focus:ring-primary/30 text-[10px]"
                                                        value={p.stockSheetId || ""}
                                                        onChange={(e) => updatePanel(p.id, "stockSheetId", e.target.value)}
                                                    >
                                                        <option value="">Default Sheet</option>
                                                        {stockSheets.map(s => (
                                                            <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}</option>
                                                        ))}
                                                    </select>
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
                            <Button
                                onClick={() => {
                                    saveProject();
                                    setIsPanelModalOpen(false);
                                }}
                                className="rounded-xl px-10 h-11 font-bold"
                            >
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
                                            <th className="pb-3 px-2">Label</th>
                                            <th className="pb-3 px-2">Length ({unitLabel})</th>
                                            <th className="pb-3 px-2">Width ({unitLabel})</th>
                                            <th className="pb-3 px-2">Thickness (mm)</th>
                                            <th className="pb-3 px-2">Qty</th>
                                            <th className="pb-3 px-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {stockSheets.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="py-2 px-2 text-[10px] font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 18mm MDF"
                                                        className="w-full h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs"
                                                        value={s.label || ""}
                                                        onChange={(e) => updateStockSheet(s.id, "label", e.target.value)}
                                                    />
                                                </td>
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
                                                        placeholder="18"
                                                        className="w-20 h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-mono"
                                                        value={s.thickness || ""}
                                                        onChange={(e) => updateStockSheet(s.id, "thickness", Number(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        className="w-16 h-9 px-3 border rounded-lg bg-transparent focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/30 text-xs font-bold"
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
                            <Button
                                onClick={() => {
                                    saveProject();
                                    setIsStockModalOpen(false);
                                }}
                                className="rounded-xl px-10 h-11 font-bold"
                            >
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
                                        {usedSheets} Total Sheets
                                    </span>
                                    {Object.entries(
                                        sheetsMetadata.reduce((acc, meta) => {
                                            const group = meta.materialGroup || 'general';
                                            acc[group] = (acc[group] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)
                                    ).map(([group, count]) => (
                                        <span key={group} className="text-xs font-bold text-muted-foreground uppercase opacity-70 flex items-center gap-1.5 border-l border-border/10 pl-4">
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                group === "carcass" ? "bg-emerald-500" :
                                                    group === "doors" ? "bg-blue-500" :
                                                        group === "backing" ? "bg-amber-500" : "bg-muted-foreground"
                                            )}></span>
                                            {count} {group}
                                        </span>
                                    ))}
                                    <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 flex items-center gap-1.5 border-l border-border/10 pl-4">
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
                                const meta = sheetsMetadata[sheetIdx] || { width: stockSheets[0]?.length || 2440, height: stockSheets[0]?.width || 1220, label: 'Standard Sheet' }
                                const sheetPanels = placements.filter((p) => p.sheetIndex === sheetIdx)
                                const levels = sheetLevels[sheetIdx] || []

                                // Calculate sheet utilization
                                const sheetUsedArea = sheetPanels.reduce((sum, p) => sum + (p.length * p.width), 0)
                                const sheetTotalArea = meta.width * meta.height
                                const sheetUtilization = sheetTotalArea > 0 ? Math.round((sheetUsedArea / sheetTotalArea) * 100) : 0

                                // Scale to fit width but maintain aspect ratio
                                const svgWidth = 1200
                                const svgHeight = (meta.height / meta.width) * svgWidth
                                const scale = svgWidth / meta.width

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
                                                    <div className="flex flex-col border-l-2 border-border/40 pl-3">
                                                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-tight">
                                                            {meta.label}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                            {meta.width}{unitLabel} × {meta.height}{unitLabel}
                                                            {meta.materialGroup && (
                                                                <span className="ml-2 inline-flex items-center gap-1">
                                                                    <span className={cn(
                                                                        "w-1.5 h-1.5 rounded-full",
                                                                        meta.materialGroup === "carcass" ? "bg-emerald-500" :
                                                                            meta.materialGroup === "doors" ? "bg-blue-500" :
                                                                                "bg-amber-500"
                                                                    )}></span>
                                                                    {meta.materialGroup}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
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
                                                    const actualW = p.length - kerfThickness
                                                    const actualH = p.width - kerfThickness

                                                    // IMPORTANT: Match panel label using base ID (removing -0, -1 suffix)
                                                    const baseId = p.panelId.split('-')[0]
                                                    const panelData = panels.find(pl => pl.id === baseId)
                                                    const materialGroup = p.materialGroup || panelData?.materialGroup || 'general'

                                                    let fillColor = "#eff6ff"
                                                    let borderColor = "#3b82f6"
                                                    let textColor = "#1e40af"

                                                    if (materialGroup === "carcass") {
                                                        fillColor = "#f0fdf4"
                                                        borderColor = "#22c55e"
                                                        textColor = "#166534"
                                                    } else if (materialGroup === "backing") {
                                                        fillColor = "#fffbeb"
                                                        borderColor = "#f59e0b"
                                                        textColor = "#92400e"
                                                    } else if (materialGroup === "doors") {
                                                        fillColor = "#eff6ff"
                                                        borderColor = "#3b82f6"
                                                        textColor = "#1e40af"
                                                    }

                                                    return (
                                                        <g key={idx} className="hover:opacity-95 transition-all cursor-default group/panel">
                                                            <rect
                                                                x={p.x * scale}
                                                                y={p.y * scale}
                                                                width={actualW * scale}
                                                                height={actualH * scale}
                                                                fill={fillColor}
                                                                stroke={borderColor}
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
                                                                        style={{ color: textColor }}
                                                                        className="font-black text-sm uppercase tracking-tight leading-none mb-1 truncate w-full"
                                                                    >
                                                                        {panelData?.label || `P-${idx + 1}`}
                                                                    </p>
                                                                    <p
                                                                        style={{ color: textColor }}
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

            {/* BOM Modal */}
            {showBOMModal && (() => {
                // Calculate Aggregated BOM
                const aggregateBOM = cabinetConfigs.reduce((acc, config) => {
                    const breakdown = getMaterialsBreakdown(config);
                    if (!breakdown) return acc;

                    const unitCount = breakdown.unitCount;

                    // Aggregate Panels
                    breakdown.panels.forEach(p => {
                        const existing = acc.panels.find(ep => ep.name === p.name && ep.l === p.l && ep.w === p.w && ep.materialGroup === p.materialGroup);
                        if (existing) {
                            existing.qty += p.qty * unitCount;
                        } else {
                            acc.panels.push({ ...p, qty: p.qty * unitCount });
                        }
                    });

                    // Aggregate Hardware
                    acc.hardware.hinges += breakdown.hardware.hinges * unitCount;
                    acc.hardware.handles += (breakdown.hardware.doorHandles + breakdown.hardware.drawerHandles) * unitCount;
                    acc.hardware.slides += breakdown.hardware.drawerSlides * unitCount;
                    acc.hardware.shelfPins += breakdown.hardware.shelfPins * unitCount;

                    // Aggregate Fasteners
                    acc.fasteners.confirmat += breakdown.fasteners.confirmatScrews * unitCount;
                    acc.fasteners.camLocks += breakdown.fasteners.camLocks * unitCount;
                    acc.fasteners.nails += breakdown.fasteners.backPanelNails * unitCount;

                    // Aggregate Edge Banding
                    acc.totalEdgeBand += breakdown.totalEdgeBand * unitCount;
                    acc.totalUnits += unitCount;

                    return acc;
                }, {
                    panels: [] as any[],
                    hardware: { hinges: 0, handles: 0, slides: 0, shelfPins: 0 },
                    fasteners: { confirmat: 0, camLocks: 0, nails: 0 },
                    totalEdgeBand: 0,
                    totalUnits: 0
                });

                return (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border-2 border-primary/20 shadow-2xl flex flex-col scale-in-95 animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="p-8 border-b border-border/20 bg-muted/30 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 text-primary-foreground">
                                        <Calculator className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Bill of Materials (BOM)</h2>
                                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-70">Production Summary — {aggregateBOM.totalUnits} Units Total</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowBOMModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative">
                                {!showReportPreview ? (
                                    <>
                                        {/* Sheets & Optimization Meta */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 mb-1">Production Required</p>
                                                <div className="flex flex-col">
                                                    <p className="text-3xl font-black leading-none">{calculated ? usedSheets : "--"} <span className="text-sm font-bold opacity-60">Sheets</span></p>
                                                    {calculated && sheetsMetadata.length > 0 && (
                                                        <div className="flex gap-2 mt-2">
                                                            {Object.entries(
                                                                sheetsMetadata.reduce((acc, meta) => {
                                                                    const group = meta.materialGroup || 'general';
                                                                    acc[group] = (acc[group] || 0) + 1;
                                                                    return acc;
                                                                }, {} as Record<string, number>)
                                                            ).map(([group, count]) => (
                                                                <span key={group} className="text-[8px] font-black uppercase flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded border border-primary/10">
                                                                    <span className={cn(
                                                                        "w-1 h-1 rounded-full",
                                                                        group === "carcass" ? "bg-emerald-500" :
                                                                            group === "doors" ? "bg-blue-500" :
                                                                                group === "backing" ? "bg-amber-500" : "bg-muted-foreground"
                                                                    )}></span>
                                                                    {count} {group}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-60 mb-1">Material Utilization</p>
                                                <p className="text-3xl font-black text-emerald-600">{calculated ? 100 - (stats.wastePercent || 0) : "--"}%</p>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-60 mb-1">Total Edge Banding</p>
                                                <p className="text-3xl font-black text-blue-600">{aggregateBOM.totalEdgeBand.toFixed(2)} <span className="text-sm font-bold opacity-60 uppercase">LM</span></p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Panels List */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                                    Panel Breakdown
                                                </h3>
                                                <div className="bg-muted/20 border border-border/10 rounded-2xl overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-muted/30 border-b border-border/10 text-[10px] uppercase font-black text-muted-foreground">
                                                            <tr>
                                                                <th className="p-3 text-left">Label</th>
                                                                <th className="p-3 text-left">Group</th>
                                                                <th className="p-3 text-left">Dimensions</th>
                                                                <th className="p-3 text-right">Qty</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/5">
                                                            {aggregateBOM.panels.map((p, i) => (
                                                                <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                                    <td className="p-3 font-bold">{p.name}</td>
                                                                    <td className="p-3">
                                                                        <span className={cn(
                                                                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                                            p.materialGroup === "carcass" ? "bg-emerald-500/10 text-emerald-600" :
                                                                                p.materialGroup === "doors" ? "bg-blue-500/10 text-blue-600" :
                                                                                    "bg-amber-500/10 text-amber-600"
                                                                        )}>
                                                                            {p.materialGroup}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 font-mono opacity-70">{p.l}×{p.w}mm</td>
                                                                    <td className="p-3 text-right font-black">×{p.qty}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Board Stock, Hardware & Fasteners */}
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                                        Board Stock Required
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {Object.entries(
                                                            sheetsMetadata.reduce((acc, meta) => {
                                                                const key = `${meta.materialGroup}|${meta.label}`;
                                                                acc[key] = (acc[key] || 0) + 1;
                                                                return acc;
                                                            }, {} as Record<string, number>)
                                                        ).map(([key, count]) => {
                                                            const [group, label] = key.split('|');
                                                            return (
                                                                <div key={key} className="p-4 rounded-xl border border-border/10 bg-muted/5">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{group}</p>
                                                                        <p className="text-[8px] font-black text-primary opacity-40 uppercase px-1 border border-primary/20 rounded-sm leading-tight">{label.split('×')[0]}mm</p>
                                                                    </div>
                                                                    <p className="text-xl font-black">{count} <span className="text-[10px] opacity-40 uppercase">Boards</span></p>
                                                                    <p className="text-[8px] font-medium opacity-50 truncate">{label}</p>
                                                                </div>
                                                            );
                                                        })}
                                                        <div className="p-4 rounded-xl border border-border/10 bg-primary/5">
                                                            <p className="text-[10px] font-bold text-primary uppercase mb-1">Total Stock</p>
                                                            <p className="text-xl font-black">{usedSheets} <span className="text-[10px] opacity-40 uppercase">Boards</span></p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                                        Fitting & Hardware
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-xl border border-border/10 bg-muted/5">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Hinges</p>
                                                            <p className="text-xl font-black">{aggregateBOM.hardware.hinges} <span className="text-[10px] opacity-40 uppercase">pcs</span></p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border border-border/10 bg-muted/5">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Handles</p>
                                                            <p className="text-xl font-black">{aggregateBOM.hardware.handles} <span className="text-[10px] opacity-40 uppercase">pcs</span></p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border border-border/10 bg-muted/5">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Drawer Slides</p>
                                                            <p className="text-xl font-black">{aggregateBOM.hardware.slides} <span className="text-[10px] opacity-40 uppercase">sets</span></p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border border-border/10 bg-muted/5">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Shelf Pins</p>
                                                            <p className="text-xl font-black">{aggregateBOM.hardware.shelfPins} <span className="text-[10px] opacity-40 uppercase">pcs</span></p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                                                        Fastener Count
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div className="flex justify-between p-3 border-b border-border/10">
                                                            <span className="font-bold uppercase opacity-60">Confirmat Screws</span>
                                                            <span className="font-black text-primary">{aggregateBOM.fasteners.confirmat}</span>
                                                        </div>
                                                        <div className="flex justify-between p-3 border-b border-border/10">
                                                            <span className="font-bold uppercase opacity-60">Cam Locks</span>
                                                            <span className="font-black text-primary">{aggregateBOM.fasteners.camLocks}</span>
                                                        </div>
                                                        <div className="flex justify-between p-3">
                                                            <span className="font-bold uppercase opacity-60">Back Panel Nails</span>
                                                            <span className="font-black text-primary">{aggregateBOM.fasteners.nails}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div id="production-report-print" className="bg-white rounded-3xl shadow-2xl p-0 !mt-0 min-h-[1000px] border border-primary/5 overflow-hidden scale-[0.85] origin-top translate-y-[-10%] transition-transform duration-500 hover:scale-[0.9] hover:translate-y-[-5%] group/report">
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                            @page { 
                                                size: A4; 
                                                margin: 15mm; 
                                            }
                                            @media print {
                                                /* === NUCLEAR RESET === */
                                                html, body {
                                                    height: auto !important;
                                                    width: 100% !important;
                                                    overflow: visible !important;
                                                    margin: 0 !important;
                                                    padding: 0 !important;
                                                    background: white !important;
                                                    -webkit-print-color-adjust: exact !important;
                                                    print-color-adjust: exact !important;
                                                }

                                                /* === HIDE ALL APP CHROME === */
                                                body > *:not([data-radix-portal]),
                                                header, footer, nav, aside,
                                                .print\\:hidden,
                                                [data-radix-portal] > div > div:first-child,
                                                [class*="backdrop"],
                                                [class*="modal"]:not(:has(#production-report-print)),
                                                button, .btn {
                                                    display: none !important;
                                                }

                                                /* === PRESERVE PORTAL STRUCTURE === */
                                                [data-radix-portal],
                                                [data-radix-portal] > div {
                                                    display: block !important;
                                                    position: static !important;
                                                    background: transparent !important;
                                                    width: 100% !important;
                                                    height: auto !important;
                                                    overflow: visible !important;
                                                    padding: 0 !important;
                                                    margin: 0 !important;
                                                }

                                                /* === FORCE REPORT VISIBILITY === */
                                                #production-report-print {
                                                    display: block !important;
                                                    visibility: visible !important;
                                                    position: static !important;
                                                    width: 100% !important;
                                                    max-width: 100% !important;
                                                    height: auto !important;
                                                    min-height: auto !important;
                                                    margin: 0 !important;
                                                    padding: 0 !important;
                                                    transform: none !important;
                                                    box-shadow: none !important;
                                                    border: none !important;
                                                    border-radius: 0 !important;
                                                    background: white !important;
                                                    overflow: visible !important;
                                                    opacity: 1 !important;
                                                }

                                                #production-report-print *,
                                                #production-report-print > div,
                                                #production-report-print > div * {
                                                    visibility: visible !important;
                                                    display: revert !important;
                                                    opacity: 1 !important;
                                                    color: inherit !important;
                                                    background-color: inherit !important;
                                                }

                                                /* === A4 INNER WRAPPER === */
                                                #production-report-print > div {
                                                    display: block !important;
                                                    width: 100% !important;
                                                    max-width: 100% !important;
                                                    min-height: auto !important;
                                                    height: auto !important;
                                                    margin: 0 !important;
                                                    padding: 10mm !important;
                                                    box-shadow: none !important;
                                                    border: none !important;
                                                    background: white !important;
                                                    position: relative !important;
                                                }

                                                /* === CONTENT FLOW === */
                                                #production-report-print table,
                                                #production-report-print .grid,
                                                #production-report-print .flex {
                                                    display: revert !important;
                                                }

                                                #production-report-print table {
                                                    width: 100% !important;
                                                    border-collapse: collapse !important;
                                                }

                                                #production-report-print th,
                                                #production-report-print td {
                                                    padding: 8px !important;
                                                }

                                                /* === PAGE BREAK CONTROL === */
                                                .avoid-break,
                                                #production-report-print .avoid-break { 
                                                    break-inside: avoid !important;
                                                    page-break-inside: avoid !important;
                                                }

                                                #production-report-print .mb-12 {
                                                    margin-bottom: 20px !important;
                                                }

                                                /* === FOOTER POSITION FIX === */
                                                #production-report-print > div > div:last-child {
                                                    position: relative !important;
                                                    bottom: auto !important;
                                                    left: auto !important;
                                                    right: auto !important;
                                                    margin-top: 30px !important;
                                                }

                                                /* === FORCE COLORS === */
                                                * {
                                                    -webkit-print-color-adjust: exact !important;
                                                    print-color-adjust: exact !important;
                                                }
                                            }
                                        `}} />
                                        <div className="max-w-[800px] mx-auto p-16 text-primary font-sans bg-white">
                                            {/* Report Header */}
                                            <div className="flex justify-between items-start border-b-[3px] border-primary pb-10 mb-10">
                                                <div>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <img src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png" alt="ModuLux" className="h-10 w-auto" />
                                                        <h1 className="text-3xl font-black uppercase tracking-tighter italic text-primary">ModuLux <span className="not-italic opacity-50">Fabricator</span></h1>
                                                    </div>
                                                    <p className="text-[9px] font-black opacity-30 tracking-[0.3em] uppercase leading-tight">Automated Production Protocol <br /> Certified Precision Output</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-black uppercase tracking-tight">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mt-1">Ref ID: PRD-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                                                </div>
                                            </div>


                                            {/* Executive Overview */}
                                            <div className="grid grid-cols-3 gap-1 mb-12">
                                                <div className="p-6 border border-primary/10 rounded-l-2xl border-r-0">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mb-2">Total Inventory</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black tracking-tighter">{usedSheets}</span>
                                                        <span className="text-[10px] font-bold uppercase opacity-40">Sheets</span>
                                                    </div>
                                                </div>
                                                <div className="p-6 border border-primary/10">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mb-2">Efficiency Rating</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black tracking-tighter">{100 - (stats.wastePercent || 0)}</span>
                                                        <span className="text-[10px] font-bold uppercase opacity-40">%</span>
                                                    </div>
                                                </div>
                                                <div className="p-6 border border-primary/10 rounded-r-2xl border-l-0">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mb-2">Edge Duration</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black tracking-tighter">{aggregateBOM.totalEdgeBand.toFixed(1)}</span>
                                                        <span className="text-[10px] font-bold uppercase opacity-40">LM</span>
                                                    </div>
                                                </div>
                                            </div>




                                            {/* Section 01: Materials */}
                                            <div className="mb-12">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <span className="w-10 h-[1.5px] bg-secondary/30"></span>
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">01 / Boards Requirements</h3>
                                                    <span className="flex-1 h-[1.5px] bg-secondary/30"></span>
                                                </div>
                                                <div className="space-y-4">
                                                    {Object.entries(
                                                        sheetsMetadata.reduce((acc, meta) => {
                                                            const key = `${meta.materialGroup}|${meta.label}|${meta.width}x${meta.height}`;
                                                            acc[key] = (acc[key] || 0) + 1;
                                                            return acc;
                                                        }, {} as Record<string, number>)
                                                    ).map(([key, count]) => {
                                                        const [group, label, dims] = key.split('|');
                                                        return (
                                                            <div key={key} className="flex items-center justify-between group/item p-4 rounded-xl border border-primary/5 bg-primary/[0.01]">
                                                                <div className="flex items-center gap-6">
                                                                    <div className="w-12 h-12 bg-primary flex items-center justify-center text-white text-xs font-black rounded-lg group-hover/item:scale-105 transition-transform uppercase shadow-lg shadow-primary/20">
                                                                        {group.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-0.5 text-primary">{group}</p>
                                                                        <p className="font-bold text-lg leading-tight tracking-tight text-primary">{label}</p>
                                                                        <p className="text-[10px] font-mono opacity-50 text-primary">{dims}mm Standard Stock</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-3xl font-black tracking-tighter text-primary">×{count}</p>
                                                                    <p className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em] text-primary">Units Required</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Section 03: Fittings */}
                                            <div className="grid grid-cols-2 gap-10 mb-12">
                                                <div className="p-6 rounded-2xl bg-primary/[0.02] border border-primary/10">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-primary border-b border-secondary/20 pb-2">03 / Fittings List</h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-2 border-b border-primary/5 last:border-0">
                                                            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest text-primary">Hinges</span>
                                                            <span className="font-black italic text-lg text-primary">{aggregateBOM.hardware.hinges} <span className="text-[8px] not-italic opacity-40">PCS</span></span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-primary/5 last:border-0">
                                                            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest text-primary">Handles</span>
                                                            <span className="font-black italic text-lg text-primary">{aggregateBOM.hardware.handles} <span className="text-[8px] not-italic opacity-40">PCS</span></span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-primary/5 last:border-0">
                                                            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest text-primary">Slides</span>
                                                            <span className="font-black italic text-lg text-primary">{aggregateBOM.hardware.slides} <span className="text-[8px] not-italic opacity-40">SETS</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-secondary/[0.02] border border-secondary/10">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-secondary border-b border-primary/20 pb-2">04 / Assembly Units</h3>
                                                    <div className="space-y-4">
                                                        <div className="p-3 bg-white/50 rounded-xl border border-primary/5">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[8px] font-black uppercase opacity-40 tracking-widest text-primary">Structural Screws</span>
                                                                <span className="text-sm font-black italic text-primary">{aggregateBOM.fasteners.confirmat}</span>
                                                            </div>
                                                            <div className="w-full bg-primary/10 h-1 rounded-full overflow-hidden">
                                                                <div className="bg-primary h-full" style={{ width: '100%' }}></div>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-white/50 rounded-xl border border-primary/5">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[8px] font-black uppercase opacity-40 tracking-widest text-primary">Mechanical Fasteners</span>
                                                                <span className="text-sm font-black italic text-primary">{aggregateBOM.fasteners.camLocks}</span>
                                                            </div>
                                                            <div className="w-full bg-primary/10 h-1 rounded-full overflow-hidden">
                                                                <div className="bg-primary h-full" style={{ width: '100%' }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 02: Cuts List */}
                                            <div className="mb-12">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <span className="w-10 h-[1.5px] bg-secondary/30"></span>
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">02 / Precision Cuts Data</h3>
                                                    <span className="flex-1 h-[1.5px] bg-secondary/30"></span>
                                                </div>
                                                <div className="border-[2px] border-primary/20 rounded-2xl overflow-hidden shadow-xl shadow-primary/5">
                                                    <table className="w-full text-[10px]">
                                                        <thead>
                                                            <tr className="bg-primary text-white text-left">
                                                                <th className="p-4 font-black uppercase tracking-widest">Component</th>
                                                                <th className="p-4 font-black uppercase tracking-widest">Dimension (L×W)</th>
                                                                <th className="p-4 font-black uppercase tracking-widest text-right">Quantity</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-primary/10 font-medium">
                                                            {aggregateBOM.panels.slice(0, 12).map((p, i) => (
                                                                <tr key={i} className="hover:bg-primary/[0.02] transition-colors">
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={cn(
                                                                                "w-1 h-3 rounded-full",
                                                                                p.materialGroup === "carcass" ? "bg-emerald-500" :
                                                                                    p.materialGroup === "doors" ? "bg-blue-500" : "bg-amber-500"
                                                                            )}></span>
                                                                            <span className="font-bold text-primary">{p.name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 font-mono font-bold tracking-tighter text-primary">{p.l} × {p.w}mm</td>
                                                                    <td className="p-4 text-right font-black text-sm text-primary">×{p.qty}</td>
                                                                </tr>
                                                            ))}
                                                            {aggregateBOM.panels.length > 12 && (
                                                                <tr className="bg-muted/5">
                                                                    <td colSpan={3} className="p-4 text-center text-[9px] font-black uppercase opacity-30 italic text-primary">
                                                                        ... Continued on Supplemental Sheets ({aggregateBOM.panels.length - 12} more items)
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Branded Watermark/Footer */}
                                            <div className="mt-16 pt-8 border-t border-primary/10 flex justify-between items-end avoid-break">
                                                <div className="opacity-30">
                                                    <div className="w-16 h-1.5 bg-secondary mb-2 rounded-full"></div>
                                                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary">APPROVED FOR FABRICATION</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <img src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png" alt="ModuLux Logo" className="h-6 w-auto opacity-20 mb-1" />
                                                    <p className="text-[9px] font-black italic opacity-10 text-primary uppercase">PRODUCTION PROTOCOL PAGE 01</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* footer */}
                            <div className="p-8 border-t border-border/20 bg-muted/30 flex justify-between items-center print:hidden">
                                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">
                                    ModuLux Fabrication Management System
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="rounded-xl px-8" onClick={() => {
                                        if (showReportPreview) setShowReportPreview(false);
                                        else setShowBOMModal(false);
                                    }}>
                                        {showReportPreview ? "Back to Summary" : "Close"}
                                    </Button>
                                    <Button variant="outline" className="rounded-xl px-8 border-primary/20 hover:bg-primary/5 group" onClick={() => setShowReportPreview(!showReportPreview)}>
                                        {showReportPreview ? (
                                            <><Calculator className="w-4 h-4 mr-2" /> Show Summary</>
                                        ) : (
                                            <><FileText className="w-4 h-4 mr-2" /> Preview Document</>
                                        )}
                                    </Button>
                                    <Button variant="outline" className="rounded-xl px-8 border-primary/20 hover:bg-primary/5 group" onClick={() => {
                                        if (!showReportPreview) {
                                            setShowReportPreview(true);
                                            setTimeout(() => handlePrintReport(), 300);
                                        } else {
                                            handlePrintReport();
                                        }
                                    }}>
                                        <Printer className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Print PDF
                                    </Button>
                                    <Button className="rounded-xl px-10 font-bold shadow-xl shadow-primary/20" onClick={saveProject}>
                                        <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Project"}
                                    </Button>
                                    <Button className="rounded-xl px-10 font-bold shadow-xl shadow-primary/20" onClick={() => {
                                        toast.success("BOM Exported to Production Queue");
                                        setShowBOMModal(false);
                                    }}>
                                        <Download className="w-4 h-4 mr-2" /> Finalize & Export
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}


            {/* Project Settings Modal */}
            {
                isProjectSettingsOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-card w-full max-w-md overflow-hidden rounded-3xl border-2 border-primary/20 shadow-2xl scale-in-95 animate-in zoom-in-95 duration-300">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black uppercase tracking-tight">Project Settings</h2>
                                    <button onClick={() => setIsProjectSettingsOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Project Name</label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="w-full bg-muted/50 border border-border/40 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Enter project name..."
                                        />
                                    </div>
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <p className="text-[10px] font-bold text-primary uppercase mb-1">Project ID</p>
                                        <p className="text-[10px] font-mono opacity-50 truncate">{projectId || "Pending Save..."}</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        saveProject();
                                        setIsProjectSettingsOpen(false);
                                    }}
                                    className="w-full rounded-2xl h-12 font-black uppercase tracking-tight shadow-lg shadow-primary/20"
                                >
                                    Done
                                </Button>

                            </div>
                        </div>
                    </div>
                )
            }

            {/* AI Plan Parser Modal */}

            {
                aiParserOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAiParserOpen(false)} />
                        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-card border border-border/40 rounded-xl shadow-2xl p-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2">AI Plan Parser</h2>
                                <p className="text-sm text-muted-foreground">
                                    Upload an architectural floor plan to automatically extract cabinet specifications
                                </p>
                            </div>
                            <AIPlanParser
                                onApply={handleApplyExtractedCabinets}
                                onClose={() => setAiParserOpen(false)}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    )
}
