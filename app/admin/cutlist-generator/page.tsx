"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, Trash2, Calculator, Download, RotateCcw, Settings, ChevronDown, ChevronUp, GripVertical, Pencil, X, Eye, Upload, Printer, FileText, Cpu, Layout, Save, FolderOpen, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AIPlanParser } from "@/components/admin/ai-plan-parser"
import { supabase } from "@/lib/supabase"



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
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)

    // Client & Project Details for BOM Report
    const [clientName, setClientName] = useState("")
    const [clientContact, setClientContact] = useState("")
    const [clientAddress, setClientAddress] = useState("")
    const [bomSubject, setBomSubject] = useState<"kitchen" | "wardrobe" | "vanity" | "entertainment" | "office" | "custom">("kitchen")

    // Bill of Quantity (BOQ) Costs
    const LABOR_RATE_PER_BOARD = 2800 // ₱2,800 per board (includes installation)
    const BOQ_STANDARD_TERMS = `1. ACCEPTANCE OF PROPOSAL
This Bill of Quantities (BOQ) constitutes a formal offer by Prime Home Palawan (hereinafter referred to as the "Contractor"). The Client ("Client") accepts this offer by signing below or by paying the initial deposit. Upon acceptance, these Terms and Conditions shall form a binding contract between the Client and the Contractor.

2. SCOPE OF WORK & EXCLUSIONS
2.1. The services and materials listed in the attached BOQ are the only items included in the quoted price.
2.2. Exclusions: Unless explicitly stated, the quotation excludes electrical modifications, plumbing alterations, major demolition (beyond specific items listed), appliance installation, and government permit fees (e.g., Barangay permits).
2.3. Pest Control Specific: The quotation covers the treatment of specific areas identified during the site assessment. It does not guarantee the 100% elimination of pests in unreachable areas (e.g., inside sealed concrete walls) or future infestations caused by neighboring properties.

3. PRICING & ESTIMATES
3.1. Validity: This quotation is valid for fifteen (15) days from the date of issue.
3.2. Firm Price: The prices for labor and materials are fixed unless otherwise noted. However, should the Client request changes (Change Orders) or unforeseen site conditions arise (see Clause 5), prices will be adjusted accordingly.
3.3. Price Fluctuation: For projects lasting longer than thirty (30) days, the Contractor reserves the right to adjust prices for materials in the event of significant increases in supplier costs beyond the Contractor’s control, provided the Client is notified in writing.

4. PAYMENT TERMS
4.1. Schedule: Payment shall be made according to the milestone schedule agreed upon (typically 50% Downpayment, 40% Progress Billing, 10% Final Turnover).
4.2. Mode of Payment: Payments shall be made in Cash, Bank Transfer, or G-Cash to official accounts only. No checks shall be deemed payment until cleared.
4.3. Late Payment: A service charge of two percent (2%) per month shall be applied to overdue amounts. The Contractor reserves the right to suspend work or delivery of materials if payments are delayed beyond five (5) working days without prior notice.
4.4. Cancellation: If the Client cancels the project after work has commenced or materials have been procured, the Client shall pay for the cost of materials procured and labor rendered, plus a cancellation fee of twenty percent (20%) of the remaining contract balance.

5. VARIATIONS AND CHANGE ORDERS
5.1. Any changes, additions, or deletions to the original scope must be requested in writing (email or SMS).
5.2. The Contractor shall provide an updated estimate for the change ("Change Order"). Work on the change will only proceed upon written approval and payment of any associated additional costs.
5.3. Reductions in scope after the start of the project will not reduce the cost of fixed overheads or preliminary expenses already incurred.

6. SITE CONDITIONS AND HIDDEN DEFECTS (Crucial for Renovation)
6.1. The BOQ is based on a visual assessment of the site. The Client warrants that the information provided regarding the site is accurate.
6.2. Hidden Conditions: In the event of structural defects, termite damage, mold, or electrical hazards discovered during the work that were not visible during the initial assessment (e.g., upon opening a wall), the Contractor shall notify the Client immediately.
6.3. Rectifying these hidden conditions is considered a "Change Order" and will be billed as an additional cost to the Client. The Contractor shall not be liable for delays caused by such hidden conditions.

7. SITE ACCESS AND SAFETY
7.1. The Client shall ensure the Contractor has safe, reasonable, and uninterrupted access to the work site during agreed working hours (8:00 AM – 5:00 PM).
7.2. The Client is responsible for securing valuables, pets, and clearing the work area of furniture/personal items prior to the commencement of work.
7.3. The Contractor shall not be liable for loss or damage to the Client’s personal property left in the work area.

8. WARRANTIES AND LIABILITY
8.1. Workmanship Warranty: The Contractor warrants that all work will be performed in a good and workmanlike manner. Defects arising from poor workmanship shall be rectified by the Contractor free of charge within a period of one (1) year for carpentry and thirty (30) days for pest control service check-ups from the date of completion.
8.2. Material Warranty: Manufacturer warranties on materials (e.g., hinges, granite, treatment chemicals) are passed directly to the Client to the extent assignable.
8.3. Limitation of Liability: The Contractor’s liability is limited to the contract price. The Contractor shall not be liable for consequential, indirect, or special damages (e.g., loss of business income, spoiled food in cabinets).
8.4. Pest Control Disclaimer: While we use premium treatments, pest control involves living organisms and environmental factors. We do not warrant against future re-infestations caused by poor sanitation, structural breaches introduced by the Client after treatment, or acts of neighboring properties.

9. DELAYS AND FORCE MAJEURE
9.1. The Contractor shall not be liable for delays in completion caused by events beyond their reasonable control, including but not limited to: typhoons, floods, strikes, pandemics, or late delivery of materials by suppliers.
9.2. Delays caused by the Client (e.g., failure to provide access, change orders) may extend the project deadline at the Contractor’s discretion.

10. TERMINATION
10.1. The Contractor may terminate this contract immediately if:
a) The Client fails to make payments when due;
b) The Client interferes with the work or violates safety regulations;
c) The Client breaches any of these Terms and Conditions.
10.2. Upon termination, the Client shall pay for all work done and materials ordered up to the date of termination.

11. GOVERNING LAW AND JURISDICTION
These Terms and Conditions shall be governed by the laws of the Republic of the Philippines. Any dispute arising from this contract shall be subject to the exclusive jurisdiction of the courts in Puerto Princesa City, Palawan.`;
    const [showBOQSection, setShowBOQSection] = useState(false)
    const [transportCost, setTransportCost] = useState(0)
    const [designFee, setDesignFee] = useState(0)
    const [miscCosts, setMiscCosts] = useState(0)
    const [materialMarkup, setMaterialMarkup] = useState(0) // percentage
    const [boqNotes, setBoqNotes] = useState("")

    // Material Unit Prices
    const [boardPrices, setBoardPrices] = useState<Record<string, number>>({
        carcass: 0,
        backing: 0,
        doors: 0
    })
    const [hardwarePrices, setHardwarePrices] = useState({
        hinges: 0,
        handles: 0,
        slides: 0,
        shelfPins: 0
    })
    const [fastenerPrices, setFastenerPrices] = useState({
        confirmat: 0,
        camLocks: 0,
        nails: 0
    })
    const [upsellItems, setUpsellItems] = useState<{ id: string, name: string, quantity: number, price: number }[]>([])

    const addUpsellItem = () => {
        setUpsellItems(prev => [...prev, { id: crypto.randomUUID(), name: "", quantity: 1, price: 0 }])
    }



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
        // Reset client details
        setClientName("")
        setClientContact("")
        setClientAddress("")
        setBomSubject("kitchen")
        // Reset BOQ state
        setTransportCost(0)
        setDesignFee(0)
        setMiscCosts(0)
        setMaterialMarkup(0)
        setBoqNotes("")
        setBoardPrices({ carcass: 0, backing: 0, doors: 0 })
        setHardwarePrices({ hinges: 0, handles: 0, slides: 0, shelfPins: 0 })
        setFastenerPrices({ confirmat: 0, camLocks: 0, nails: 0 })
        setUpsellItems([])
        setShowBOQSection(false)
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

                // Restore client & BOM details
                if (project.options.clientName) setClientName(project.options.clientName)
                if (project.options.clientContact) setClientContact(project.options.clientContact)
                if (project.options.clientAddress) setClientAddress(project.options.clientAddress)
                if (project.options.bomSubject) setBomSubject(project.options.bomSubject)

                // Restore BOQ state
                if (project.options.transportCost !== undefined) setTransportCost(project.options.transportCost)
                if (project.options.designFee !== undefined) setDesignFee(project.options.designFee)
                if (project.options.miscCosts !== undefined) setMiscCosts(project.options.miscCosts)
                if (project.options.materialMarkup !== undefined) setMaterialMarkup(project.options.materialMarkup)
                if (project.options.boqNotes !== undefined) setBoqNotes(project.options.boqNotes)
                if (project.options.boardPrices) setBoardPrices(project.options.boardPrices)
                if (project.options.hardwarePrices) setHardwarePrices(project.options.hardwarePrices)
                if (project.options.fastenerPrices) setFastenerPrices(project.options.fastenerPrices)
                if (project.options.upsellItems) setUpsellItems(project.options.upsellItems)

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

    // Computed: Aggregate BOM from cabinet configs (used for BOQ calculations and printing)
    const aggregateBOM = useMemo(() => {
        return cabinetConfigs.reduce((acc, config) => {
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
    }, [cabinetConfigs]);

    // Print BOQ (Bill of Quantity) - Professional Quotation Template
    const handlePrintBOQ = () => {
        // Calculate all totals
        const boardTotal = Object.entries(boardPrices).reduce((sum, [group, price]) => {
            const count = sheetsMetadata.filter(m => m.materialGroup === group).length;
            return sum + (price * count);
        }, 0);
        const hardwareTotal = (hardwarePrices.hinges * aggregateBOM.hardware.hinges) +
            (hardwarePrices.handles * aggregateBOM.hardware.handles) +
            (hardwarePrices.slides * aggregateBOM.hardware.slides) +
            (hardwarePrices.shelfPins * aggregateBOM.hardware.shelfPins);
        const fastenerTotal = (fastenerPrices.confirmat * aggregateBOM.fasteners.confirmat) +
            (fastenerPrices.camLocks * aggregateBOM.fasteners.camLocks) +
            (fastenerPrices.nails * aggregateBOM.fasteners.nails);
        const materialSubtotal = boardTotal + hardwareTotal + fastenerTotal;
        const upsellTotal = upsellItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const markupAmount = materialSubtotal * (materialMarkup / 100);
        const laborTotal = usedSheets * LABOR_RATE_PER_BOARD;
        const additionalTotal = transportCost + designFee + miscCosts;
        const grandTotal = materialSubtotal + markupAmount + laborTotal + additionalTotal + upsellTotal;

        // Generate board items HTML
        const boardItemsHTML = Object.entries(
            sheetsMetadata.reduce((acc, meta) => {
                const group = meta.materialGroup || 'general';
                const label = meta.label || 'Unknown Material';
                if (!acc[group]) acc[group] = { count: 0, label };
                acc[group].count++;
                return acc;
            }, {} as Record<string, { count: number; label: string }>)
        ).map(([group, data]) => `
            <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600;">${data.label}</div>
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">${group}</div>
                </td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${data.count}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(boardPrices[group] || 0).toLocaleString()}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${((boardPrices[group] || 0) * data.count).toLocaleString()}</td>
            </tr>
        `).join('');

        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        if (!printWindow) {
            toast.error("Could not open print window. Please allow popups.");
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ModuLux Quotation - ${projectName}</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.5; font-size: 12px; background: white; }
                    .container { max-width: 100%; padding: 24px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a2e; padding-bottom: 24px; margin-bottom: 24px; }
                    .logo-section { }
                    .logo { height: 40px; margin-bottom: 8px; }
                    .company-name { font-size: 24px; font-weight: 900; color: #1e3a2e; letter-spacing: -0.5px; }
                    .company-tagline { font-size: 10px; color: #b8860b; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; }
                    .doc-info { text-align: right; }
                    .doc-title { font-size: 20px; font-weight: 900; color: #1e3a2e; text-transform: uppercase; letter-spacing: 2px; }
                    .doc-number { font-size: 11px; color: #6b7280; margin-top: 4px; }
                    .doc-date { font-size: 11px; color: #6b7280; }
                    
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
                    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
                    .info-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
                    .info-value { font-size: 13px; font-weight: 600; color: #1e3a2e; }
                    .info-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
                    
                    .section { margin-bottom: 20px; }
                    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1e3a2e; border-bottom: 2px solid #1e3a2e; padding-bottom: 8px; margin-bottom: 12px; }
                    
                    table { width: 100%; border-collapse: collapse; }
                    thead { background: #1e3a2e; color: white; }
                    th { padding: 10px 16px; text-align: left; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
                    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
                    th:last-child { text-align: right; }
                    td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
                    
                    .subtotal-row { background: #f3f4f6; }
                    .subtotal-row td { font-weight: 700; }
                    .total-row { background: #1e3a2e; color: white; }
                    .total-row td { font-weight: 900; font-size: 14px; padding: 16px; }
                    
                    .notes-section { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 24px; }
                    .notes-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b45309; margin-bottom: 8px; }
                    .notes-content { font-size: 11px; color: #78350f; white-space: pre-wrap; }
                    
                    .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
                    .sig-box { text-align: center; }
                    .sig-line { border-bottom: 1px solid #1e3a2e; height: 40px; margin-bottom: 8px; }
                    .sig-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; }
                    
                    .footer { margin-top: 32px; text-align: center; font-size: 9px; color: #9ca3af; }
                    .footer-brand { font-weight: 800; color: #1e3a2e; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo-section">
                            <img src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png" alt="ModuLux" class="logo" />
                            <div class="company-name">ModuLux</div>
                            <div class="company-tagline">Custom Cabinetry & Millwork</div>
                        </div>
                        <div class="doc-info">
                            <div class="doc-title">Quotation</div>
                            <div class="doc-number">Ref: ${projectId || 'DRAFT-' + Date.now().toString(36).toUpperCase()}</div>
                            <div class="doc-date">Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-box">
                            <div class="info-label">Project Information</div>
                            <div class="info-value">${projectName}</div>
                            <div class="info-sub">${bomSubject.charAt(0).toUpperCase() + bomSubject.slice(1)} Cabinetry</div>
                        </div>
                        <div class="info-box">
                            <div class="info-label">Client Details</div>
                            <div class="info-value">${clientName || 'To be specified'}</div>
                            <div class="info-sub">${clientContact || ''}</div>
                            <div class="info-sub">${clientAddress || ''}</div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Materials & Components</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40%;">Description</th>
                                    <th style="width: 15%;">Qty</th>
                                    <th style="width: 20%;">Unit Price</th>
                                    <th style="width: 25%;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${boardItemsHTML}
                                
                                ${aggregateBOM.hardware.hinges > 0 ? `
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Hinges</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${aggregateBOM.hardware.hinges} pcs</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${hardwarePrices.hinges.toLocaleString()}</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${(hardwarePrices.hinges * aggregateBOM.hardware.hinges).toLocaleString()}</td>
                                </tr>` : ''}
                                
                                ${aggregateBOM.hardware.handles > 0 ? `
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Cabinet Handles</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${aggregateBOM.hardware.handles} pcs</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${hardwarePrices.handles.toLocaleString()}</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${(hardwarePrices.handles * aggregateBOM.hardware.handles).toLocaleString()}</td>
                                </tr>` : ''}
                                
                                ${aggregateBOM.hardware.slides > 0 ? `
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Drawer Slides (pairs)</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${aggregateBOM.hardware.slides} sets</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${hardwarePrices.slides.toLocaleString()}</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${(hardwarePrices.slides * aggregateBOM.hardware.slides).toLocaleString()}</td>
                                </tr>` : ''}
                                
                                ${aggregateBOM.hardware.shelfPins > 0 ? `
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Shelf Pins</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${aggregateBOM.hardware.shelfPins} pcs</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${hardwarePrices.shelfPins.toLocaleString()}</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${(hardwarePrices.shelfPins * aggregateBOM.hardware.shelfPins).toLocaleString()}</td>
                                </tr>` : ''}
                                
                                ${fastenerTotal > 0 ? `
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Fasteners & Hardware (screws, cam locks, nails)</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">1 lot</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">—</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${fastenerTotal.toLocaleString()}</td>
                                </tr>` : ''}
                                ${upsellItems.length > 0 ? upsellItems.map(item => `
                                 <tr>
                                     <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">${item.name || 'Additional Item'}</td>
                                     <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                                     <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(item.price || 0).toLocaleString()}</td>
                                     <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</td>
                                 </tr>
                                 `).join('') : ''}
                                 
                                 <tr class="subtotal-row">
                                     <td colspan="3" style="padding: 12px 16px; text-align: right; border-bottom: 1px solid #d1d5db;">Materials Subtotal</td>
                                     <td style="padding: 12px 16px; text-align: right; border-bottom: 1px solid #d1d5db;">₱${materialSubtotal.toLocaleString()}</td>
                                 </tr>
                                
                                ${materialMarkup > 0 ? `
                                <tr>
                                    <td colspan="3" style="padding: 12px 16px; text-align: right; border-bottom: 1px solid #e5e7eb;">Material Markup (${materialMarkup}%)</td>
                                    <td style="padding: 12px 16px; text-align: right; border-bottom: 1px solid #e5e7eb;">₱${markupAmount.toLocaleString()}</td>
                                </tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Labor & Services</div>
                        <table>
                            <tbody>
                                <tr>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; width: 40%;">
                                        <div style="font-weight: 600;">Fabrication & Installation</div>
                                        <div style="font-size: 10px; color: #6b7280;">Includes on-site installation</div>
                                    </td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; width: 15%;">${usedSheets} boards</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; width: 20%;">₱${LABOR_RATE_PER_BOARD.toLocaleString()}/board</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; width: 25%;">₱${laborTotal.toLocaleString()}</td>
                                </tr>
                                ${transportCost > 0 ? `
                                <tr>
                                    <td colspan="3" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Transportation / Delivery</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${transportCost.toLocaleString()}</td>
                                </tr>` : ''}
                                ${designFee > 0 ? `
                                <tr>
                                    <td colspan="3" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Design Consultation Fee</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${designFee.toLocaleString()}</td>
                                </tr>` : ''}
                                ${miscCosts > 0 ? `
                                <tr>
                                    <td colspan="3" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Miscellaneous</td>
                                    <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${miscCosts.toLocaleString()}</td>
                                </tr>` : ''}
                            </tbody>
                        </table>
                        <div style="margin-top: 10px; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">
                            <div style="font-size: 9px; color: #4b5563; margin-bottom: 8px; line-height: 1.4;">
                                <strong>Note on Labor:</strong> Fabrication and installation are performed using high-precision portable power tools. Rate reflects industry standard manual fabrication complexity.
                            </div>
                            <div style="font-size: 9px; color: #b8860b; margin-bottom: 8px; line-height: 1.4; border-top: 1px solid #e5e7eb; pt-8;">
                                <strong>Optional Premium CNC Processing:</strong> Extreme 0.1mm dimensional accuracy and "factory-fit" quality available for an additional fee. Logistics and handling costs from Manila facility apply.
                            </div>
                            <div style="font-size: 9px; color: #1e3a2e; line-height: 1.4; border-top: 1px solid #e5e7eb; pt-8;">
                                <strong>Material Sourcing Option:</strong> Clients may opt for <em>self-acquisition of materials</em> to manage project budgeting. All materials listed in this BOQ are verified premium-grade selections from our trusted supply chain.
                            </div>
                        </div>
                    </div>
                    
                    <table>
                        <tbody>
                            <tr class="total-row">
                                <td colspan="3" style="text-align: right;">GRAND TOTAL</td>
                                <td style="text-align: right; font-size: 18px;">₱${grandTotal.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    ${boqNotes ? `
                    <div class="notes-section">
                        <div class="notes-title">Terms & Conditions</div>
                        <div class="notes-content">${boqNotes}</div>
                    </div>` : `
                    <div class="notes-section">
                        <div class="notes-title">Terms & Conditions</div>
                        <div class="notes-content">${BOQ_STANDARD_TERMS}</div>
                    </div>`}
                    
                    <div class="signature-section">
                        <div class="sig-box">
                            <div class="sig-line"></div>
                            <div class="sig-label">Client Signature / Date</div>
                        </div>
                        <div class="sig-box">
                            <div class="sig-line"></div>
                            <div class="sig-label">Authorized Representative</div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <span class="footer-brand">MODULUX</span> — Custom Cabinetry & Millwork | Generated on ${new Date().toLocaleDateString('en-PH')}
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };


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
                        cabinetDefaults: cabinetTypeDefaults,
                        // Client & BOM details
                        clientName,
                        clientContact,
                        clientAddress,
                        bomSubject,
                        // BOQ state
                        transportCost,
                        designFee,
                        miscCosts,
                        materialMarkup,
                        boqNotes,
                        boardPrices,
                        hardwarePrices,
                        fastenerPrices,
                        upsellItems
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
                        id: crypto.randomUUID(), // Always generate new UUID to avoid duplicate key conflicts
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
        <div className="min-h-screen bg-[#FAFBFB] py-6 space-y-8">
            <div className="max-w-[1600px] mx-auto px-6 space-y-6">
                {/* Premium Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCutsTab("projects")}
                                className="p-3 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/10 transition-all group"
                                title="View Saved Projects"
                            >
                                <FolderOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={startNewProject}
                                className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 transition-all group"
                                title="New Project"
                            >
                                <Plus className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        <div>
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    className="text-2xl font-black tracking-tight bg-transparent border-b-2 border-primary/20 outline-none px-1 text-slate-900 w-full min-w-[200px]"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    onBlur={() => setIsEditingName(false)}
                                    onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                                />
                            ) : (
                                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900">
                                    {projectName}
                                    <button onClick={() => setIsEditingName(true)} className="opacity-30 hover:opacity-100 transition-opacity" title="Edit Name">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsProjectSettingsOpen(true)}
                                        className="opacity-30 hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-lg"
                                        title="Project Settings & Client Details"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                    {projectId && (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{projectId.slice(0, 8)}</span>
                                    )}
                                </h1>
                            )}
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Panel Optimization Suite</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center p-1.5 bg-slate-50 border border-slate-100 rounded-xl mr-2">
                            {(["mm", "cm", "m", "in"] as const).map((u) => (
                                <button
                                    key={u}
                                    onClick={() => setUnit(u)}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 uppercase",
                                        unit === u
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-slate-400 hover:text-slate-700 hover:bg-white"
                                    )}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all md:hover:-translate-y-0.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>

                        <button
                            onClick={exportJSON}
                            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all md:hover:-translate-y-0.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>

                        <button
                            onClick={saveProject}
                            disabled={isSaving}
                            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all md:hover:-translate-y-0.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>

                        <button
                            onClick={() => setShowBOMModal(true)}
                            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all md:hover:-translate-y-0.5 border border-emerald-500/20 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 gap-2"
                        >
                            <FileText className="w-4 h-4" /> Process BOM
                        </button>

                        <button
                            onClick={calculate}
                            className="inline-flex items-center justify-center h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all md:hover:-translate-y-0.5 shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] gap-2"
                        >
                            <Calculator className="w-4 h-4" /> Calculate
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Inputs */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Cabinet Builder */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <Layout className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Cabinet Builder</h2>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Automated Extraction</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCabinetBuilder(!showCabinetBuilder)}
                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    {showCabinetBuilder ? "Hide" : "Show"}
                                </button>
                            </div>
                            {showCabinetBuilder && (
                                <div className="space-y-4">
                                    {/* Upload Plan Button */}
                                    <div className="mb-2">
                                        <Button
                                            onClick={() => setAiParserOpen(true)}
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-10 rounded-xl border-dashed border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-600 gap-2 transition-all"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Architectural Plan
                                        </Button>
                                    </div>

                                    {/* Add Cabinet Buttons with Settings */}
                                    <div className="flex gap-2">
                                        {(["base", "hanging", "tall"] as const).map((type) => {
                                            const colors = {
                                                base: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
                                                hanging: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
                                                tall: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
                                            }
                                            return (
                                                <div key={type} className="flex-1 flex gap-1 group">
                                                    <button
                                                        onClick={() => addCabinetConfig(type)}
                                                        className={cn(
                                                            "flex-1 h-9 flex items-center justify-center text-[10px] font-black uppercase rounded-lg text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95",
                                                            colors[type]
                                                        )}
                                                    >
                                                        + {type}
                                                    </button>
                                                    <button
                                                        onClick={() => setSettingsModalType(type)}
                                                        className="h-9 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                                                        title={`Configure ${type} defaults`}
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Settings Modal */}
                                    {settingsModalType && (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{settingsModalType} Defaults</span>
                                                <button onClick={() => setSettingsModalType(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-3 h-3 text-slate-400" /></button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Height</label>
                                                    <input type="number" className="w-full p-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/10" value={cabinetTypeDefaults[settingsModalType].height} onChange={(e) => updateTypeDefaults(settingsModalType, "height", Number(e.target.value))} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Depth</label>
                                                    <input type="number" className="w-full p-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/10" value={cabinetTypeDefaults[settingsModalType].depth} onChange={(e) => updateTypeDefaults(settingsModalType, "depth", Number(e.target.value))} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Width</label>
                                                    <input type="number" className="w-full p-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/10" value={cabinetTypeDefaults[settingsModalType].width} onChange={(e) => updateTypeDefaults(settingsModalType, "width", Number(e.target.value))} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Doors</label>
                                                    <select className="w-full p-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/10" value={cabinetTypeDefaults[settingsModalType].doorsPerUnit} onChange={(e) => updateTypeDefaults(settingsModalType, "doorsPerUnit", Number(e.target.value))}>
                                                        <option value={1}>1</option>
                                                        <option value={2}>2</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Shelves</label>
                                                    <input type="number" min={0} max={5} className="w-full p-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/10" value={cabinetTypeDefaults[settingsModalType].shelves} onChange={(e) => updateTypeDefaults(settingsModalType, "shelves", Number(e.target.value))} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Drawers</label>
                                                    <input type="number" min={0} max={4} className="w-full p-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/10" value={cabinetTypeDefaults[settingsModalType].drawers} onChange={(e) => updateTypeDefaults(settingsModalType, "drawers", Number(e.target.value))} disabled={settingsModalType === "hanging"} />
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-3 border-t border-slate-200/60">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Default Materials</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {/* Carcass Material */}
                                                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                                                        <select
                                                            className="flex-1 text-[11px] font-medium bg-transparent outline-none text-slate-600"
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
                                                            <option value="">Select Carcass Material...</option>
                                                            {stockSheets.map(s => <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Backing Material */}
                                                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                                        <select
                                                            className="flex-1 text-[11px] font-medium bg-transparent outline-none text-slate-600"
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
                                                            <option value="">Select Backing Material...</option>
                                                            {stockSheets.map(s => <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Door Material */}
                                                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
                                                        <select
                                                            className="flex-1 text-[11px] font-medium bg-transparent outline-none text-slate-600"
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
                                                            <option value="">Select Door/Front Material...</option>
                                                            {stockSheets.map(s => <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}{s.thickness ? ` (${s.thickness}mm)` : ""}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                                <p className="text-[9px] text-slate-400 italic">Settings sync to project</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-3 gap-1.5"
                                                    onClick={saveProject}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                    Save Config
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Wireframe Strip */}
                                    {cabinetConfigs.length > 0 && (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 overflow-x-auto custom-scrollbar">
                                            <div className="flex gap-2" style={{ minWidth: "max-content" }}>
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
                                                                "flex flex-col items-center cursor-pointer transition-all p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm",
                                                                selectedCabinetId === config.id ? "ring-2 ring-primary bg-white shadow-md border-primary/20" : ""
                                                            )}
                                                            onClick={() => {
                                                                setSelectedCabinetId(config.id);
                                                                setEditingCabinetId(config.id);
                                                            }}
                                                            title={`${config.type.toUpperCase()} #${idx + 1}\n${config.height}×${config.depth}×${config.unitWidth}mm\n${unitCount} unit${unitCount !== 1 ? "s" : ""}`}
                                                        >
                                                            <span className="text-[9px] font-mono text-slate-400 mb-1">{config.unitWidth}</span>
                                                            <svg width={svgW + 10} height={svgH + 10} className="block drop-shadow-sm">
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
                                                                {config.drawers > 0 && Array.from({ length: config.drawers }).map((_, di) => (
                                                                    <rect key={di} x={6} y={svgH - 8 - (di * 8)} width={svgW - 2} height={6} fill={typeColors[config.type]} fillOpacity={0.2} stroke={typeColors[config.type]} strokeWidth={0.5} />
                                                                ))}
                                                            </svg>
                                                            <span className="text-[10px] font-black uppercase mt-1 tracking-wider" style={{ color: typeColors[config.type] }}>{config.type} #{idx + 1}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cabinet Config Cards (Scrollable List) */}
                                    <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                        {[...cabinetConfigs].sort((a, b) => a.order - b.order).map((config, idx) => {
                                            const typeColors = {
                                                base: "border-emerald-500/20 bg-emerald-50/50 hover:border-emerald-500/40",
                                                hanging: "border-blue-500/20 bg-blue-50/50 hover:border-blue-500/40",
                                                tall: "border-amber-500/20 bg-amber-50/50 hover:border-amber-500/40",
                                            }
                                            const typeBadgeColors = {
                                                base: "bg-emerald-500 text-white shadow-emerald-500/20",
                                                hanging: "bg-blue-500 text-white shadow-blue-500/20",
                                                tall: "bg-amber-500 text-white shadow-amber-500/20",
                                            }
                                            const unitCount = Math.floor((config.linearMeters * 1000) / config.unitWidth)
                                            return (
                                                <div
                                                    key={config.id}
                                                    className={cn(
                                                        "p-4 rounded-2xl border flex items-center justify-between transition-all group",
                                                        typeColors[config.type],
                                                        selectedCabinetId === config.id && "ring-2 ring-primary bg-white shadow-lg shadow-black/5"
                                                    )}
                                                    onClick={() => setSelectedCabinetId(config.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col gap-1 items-center bg-white/50 p-1 rounded-lg border border-black/5">
                                                            <button onClick={(e) => { e.stopPropagation(); moveCabinetConfig(config.id, "up"); }} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-primary disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                                                            <span className="text-[9px] font-black text-slate-300">{idx + 1}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); moveCabinetConfig(config.id, "down"); }} disabled={idx === cabinetConfigs.length - 1} className="p-0.5 text-slate-400 hover:text-primary disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm tracking-wide", typeBadgeColors[config.type])}>
                                                                    {config.type}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-500">
                                                                    {unitCount} unit{unitCount !== 1 ? "s" : ""}
                                                                </span>
                                                            </div>
                                                            <span className="text-[12px] font-medium text-slate-700 font-mono">
                                                                {config.height} × {config.depth} × {config.unitWidth}mm
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingCabinetId(config.id); }}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                                                            title="Edit Details"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeCabinetConfig(config.id); }}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100 shadow-none hover:shadow-sm"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <Button
                                        variant="default"
                                        size="lg"
                                        className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2 mt-4"
                                        onClick={generatePanelsFromCabinets}
                                    >
                                        <Calculator className="w-4 h-4" /> Generate Cutlist Panels
                                    </Button>
                                </div>
                            )}
                        </div>


                        {/* Panels */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                                        <GripVertical className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Panels</h2>
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{panels.length} Items</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsPanelModalOpen(true)}
                                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-3 gap-2 transition-all"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Manage
                                </Button>
                            </div>

                            {panels.length > 0 ? (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {panels.slice(0, 10).map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-all">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    {p.materialGroup === "carcass" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"></span>}
                                                    {p.materialGroup === "doors" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"></span>}
                                                    {p.materialGroup === "backing" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"></span>}
                                                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{p.label || "Untitled Panel"}</span>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-400 pl-3.5">{p.length} × {p.width} {unitLabel}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-600 shadow-sm">×{p.quantity}</span>
                                                <button onClick={() => removePanel(p.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {panels.length > 10 && (
                                        <button
                                            onClick={() => setIsPanelModalOpen(true)}
                                            className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors text-center border-t border-slate-100 mt-2"
                                        >
                                            + {panels.length - 10} more panels
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer group" onClick={addPanel}>
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <Plus className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">No panels added</p>
                                </div>
                            )}
                        </div>

                        {/* Stock Sheets */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-xl">
                                        <FolderOpen className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Stock Sheets</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stockSheets.length} Types</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsStockModalOpen(true)}
                                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 hover:bg-slate-100 px-3 gap-2 transition-all"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Manage
                                </Button>
                            </div>

                            {stockSheets.length > 0 ? (
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                    {stockSheets.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-bold text-slate-700">{s.length} × {s.width} {unitLabel}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Standard Sheet</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-600 shadow-sm">×{s.quantity}</span>
                                                <button onClick={() => removeStockSheet(s.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group" onClick={addStockSheet}>
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <Plus className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">No stock added</p>
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                    <Settings className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Configuration</h2>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Optimization Settings</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Blade Thickness ({unitLabel})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-16 p-1.5 text-[11px] font-bold border border-slate-200 rounded-lg bg-white text-right focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700"
                                        value={kerfThickness}
                                        onChange={(e) => setKerfThickness(Number(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Labels on Panels</label>
                                    <input
                                        type="checkbox"
                                        checked={labelsOnPanels}
                                        onChange={(e) => setLabelsOnPanels(e.target.checked)}
                                        className="w-4 h-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Consider Material</label>
                                    <input
                                        type="checkbox"
                                        checked={considerMaterial}
                                        onChange={(e) => setConsiderMaterial(e.target.checked)}
                                        className="w-4 h-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Edge Banding</label>
                                    <input
                                        type="checkbox"
                                        checked={edgeBanding}
                                        onChange={(e) => setEdgeBanding(e.target.checked)}
                                        className="w-4 h-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Grain Direction</label>
                                    <input
                                        type="checkbox"
                                        checked={grainDirection}
                                        onChange={(e) => setGrainDirection(e.target.checked)}
                                        className="w-4 h-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Column: Visual Diagram */}
                    <div className="lg:col-span-4 h-full">
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] h-[600px] flex flex-col transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                                        <Layout className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Sheet Layout</h2>
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Visual Diagram</p>
                                    </div>
                                </div>
                                {calculated && (
                                    <Button variant="ghost" size="sm" onClick={() => setIsLayoutModalOpen(true)} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-3 gap-2 transition-all">
                                        <Eye className="w-3.5 h-3.5" />
                                        Expand
                                    </Button>
                                )}
                            </div>

                            {!calculated ? (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                            <Calculator className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-[13px] font-black text-slate-800 uppercase tracking-widest mb-1">Ready for calculation</p>
                                        <p className="text-[11px] font-medium text-slate-400">Add panels and stock to begin</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                    {/* Compact Summary */}
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sheets Used</p>
                                            <p className="text-3xl font-black text-slate-800">{usedSheets}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Efficiency</p>
                                            <p className="text-3xl font-black text-emerald-600">{100 - (stats.wastePercent || 0)}%</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                        {Array.from({ length: usedSheets }).map((_, sheetIdx) => {
                                            const sheetPanels = placements.filter((p) => p.sheetIndex === sheetIdx)
                                            const meta = sheetsMetadata[sheetIdx]
                                            return (
                                                <div
                                                    key={sheetIdx}
                                                    className="group p-3 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                                                    onClick={() => setIsLayoutModalOpen(true)}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black bg-slate-800 text-white px-2 py-1 rounded-lg">SHEET {sheetIdx + 1}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                {meta?.materialGroup === "carcass" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                                                {meta?.materialGroup === "doors" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                                                                {meta?.materialGroup === "backing" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">{meta?.label || 'Standard Sheet'}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{sheetPanels.length} Items</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${100 - (stats.wastePercent || 0)}%` }}></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <Button
                                        className="w-full h-12 rounded-xl font-bold uppercase tracking-widest gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 mt-auto"
                                        onClick={() => setIsLayoutModalOpen(true)}
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Full Diagrams
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Statistics */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Global Statistics */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <Zap className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800">Optimization Metrics</h2>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Performance Stats</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Utilization</p>
                                    <p className="text-2xl font-black text-slate-800">{100 - (stats.wastePercent || 0)}%</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waste</p>
                                    <p className="text-2xl font-black text-red-500">{stats.wastePercent || 0}%</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Sheets Used</span>
                                    <span className="font-black text-slate-800">{stats.usedSheets}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Used Area</span>
                                    <span className="font-black text-slate-800">{Number(stats.totalUsedArea).toLocaleString()} <span className="text-[9px] font-bold text-slate-400">{unitLabel}²</span></span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Cut Operations</span>
                                    <span className="font-black text-slate-800">{stats.totalCuts}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Cut Length</span>
                                    <span className="font-black text-slate-800">{Number(stats.cutLength).toLocaleString()} <span className="text-[9px] font-bold text-slate-400">{unitLabel}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Cuts Table / Saved Projects (Tabbed)                        {/* Cuts Table / Saved Projects (Tabbed) */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_12px_40px_rgb(0,0,0,0.03)] flex flex-col max-h-[500px] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                            <div className="flex items-center gap-2 mb-6 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                <button
                                    onClick={() => setCutsTab("cuts")}
                                    className={cn(
                                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                        cutsTab === "cuts" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Cuts Breakdown
                                </button>
                                <button
                                    onClick={() => setCutsTab("projects")}
                                    className={cn(
                                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                        cutsTab === "projects" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Saved Projects ({savedProjects.length})
                                </button>
                            </div>

                            {cutsTab === "cuts" ? (
                                cutsData.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <Layout className="w-8 h-8 mb-3 opacity-20" />
                                        <p className="text-[11px] font-bold uppercase tracking-widest">No layout generated</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-[10px] border-collapse bg-white">
                                                <thead className="bg-slate-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="p-3 text-left font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">#</th>
                                                        <th className="p-3 text-left font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Size ({unitLabel})</th>
                                                        <th className="p-3 text-left font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Location</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {cutsData.map((c, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="p-3 font-mono text-slate-400 group-hover:text-indigo-500">{idx + 1}</td>
                                                            <td className="p-3 font-mono font-bold text-slate-700">{c.cut}</td>
                                                            <td className="p-3 text-slate-500">{c.result}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="flex-1 overflow-auto pr-1 space-y-2 custom-scrollbar max-h-[350px]">
                                    {savedProjects.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <FolderOpen className="w-8 h-8 mb-3 opacity-20" />
                                            <p className="text-[11px] font-bold uppercase tracking-widest">No saved projects</p>
                                        </div>
                                    ) : (
                                        savedProjects.map((proj) => (
                                            <div
                                                key={proj.id}
                                                className={cn(
                                                    "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-default",
                                                    proj.id === projectId ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/10" : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className={cn("text-sm font-bold truncate", proj.id === projectId ? "text-indigo-900" : "text-slate-700")}>
                                                            {proj.name}
                                                        </h3>
                                                        {proj.id === projectId && <span className="text-[8px] font-black uppercase bg-indigo-600 text-white px-1.5 py-0.5 rounded-full tracking-wide">Active</span>}
                                                    </div>
                                                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                                                        <span>{proj.updated_at ? new Date(proj.updated_at).toLocaleDateString() : "No date"}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span>{proj.metrics?.sheetsUsed || 0} Sheets</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                                            proj.id === projectId
                                                                ? "bg-white text-indigo-300 cursor-default"
                                                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                                        )}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            loadProject(proj.id);
                                                            setCutsTab("cuts");
                                                        }}
                                                        disabled={proj.id === projectId}
                                                    >
                                                        {proj.id === projectId ? "Loaded" : "Load"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setProjectToDelete({ id: proj.id, name: proj.name });
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
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
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
                            <div className={cn("bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] p-0 relative flex flex-col scale-in-95 animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5", typeColors[config.type])}>
                                <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md py-6 px-8 z-10 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl">
                                            <Settings className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">{config.type} Cabinet</h2>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configuration & Materials</p>
                                        </div>
                                        <span className="ml-2 text-[10px] font-mono text-slate-300 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">#{config.id.slice(0, 8)}</span>
                                    </div>
                                    <button onClick={() => setEditingCabinetId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                                        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                                    </button>
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Left Side: Configuration */}
                                        <div className="space-y-8">
                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                                                    <span className="w-6 h-1 bg-indigo-500 rounded-full"></span>
                                                    Dimensions
                                                </h3>
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1">Height (mm)</label>
                                                        <input type="number" className="w-full h-11 px-4 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition-all shadow-sm" value={config.height} onChange={(e) => updateCabinetConfig(config.id, "height", Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1">Depth (mm)</label>
                                                        <input type="number" className="w-full h-11 px-4 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition-all shadow-sm" value={config.depth} onChange={(e) => updateCabinetConfig(config.id, "depth", Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1">Unit Width (mm)</label>
                                                        <input type="number" className="w-full h-11 px-4 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition-all shadow-sm" value={config.unitWidth} onChange={(e) => updateCabinetConfig(config.id, "unitWidth", Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1">Linear Meters (m)</label>
                                                        <input type="number" step="0.1" className="w-full h-11 px-4 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition-all shadow-sm" value={config.linearMeters} onChange={(e) => updateCabinetConfig(config.id, "linearMeters", Number(e.target.value))} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                                                    <span className="w-6 h-1 bg-indigo-500 rounded-full"></span>
                                                    Components
                                                </h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1">Doors</label>
                                                        <select className="w-full h-11 px-3 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 shadow-sm" value={config.doorsPerUnit} onChange={(e) => updateCabinetConfig(config.id, "doorsPerUnit", Number(e.target.value) as 1 | 2)}>
                                                            <option value={1}>1 Door</option>
                                                            <option value={2}>2 Doors</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1">Shelves</label>
                                                        <input type="number" min={0} max={10} className="w-full h-11 px-4 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 shadow-sm" value={config.shelves} onChange={(e) => updateCabinetConfig(config.id, "shelves", Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1">Drawers</label>
                                                        <input type="number" min={0} max={5} className="w-full h-11 px-4 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 shadow-sm" value={config.drawers} onChange={(e) => updateCabinetConfig(config.id, "drawers", Number(e.target.value))} disabled={config.type === "hanging"} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                                                    <span className="w-6 h-1 bg-indigo-500 rounded-full"></span>
                                                    Materials
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"></span>
                                                            Carcass (Sides, Top, Bottom, Shelves)
                                                        </label>
                                                        <select
                                                            className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-700 shadow-sm"
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
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"></span>
                                                            Doors & Drawer Fronts
                                                        </label>
                                                        <select
                                                            className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-700 shadow-sm"
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
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-1 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"></span>
                                                            Backing
                                                        </label>
                                                        <select
                                                            className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-700 shadow-sm"
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
                                        <div className="space-y-4 bg-slate-900 p-6 rounded-[24px] text-white shadow-xl shadow-slate-900/10">
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                                                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Materials Breakdown</h3>
                                                <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-1 rounded-lg">{breakdown.unitCount} Total Units</span>
                                            </div>

                                            <div className="space-y-6 text-[11px]">
                                                <div>
                                                    <p className="font-bold text-slate-500 uppercase tracking-widest mb-3 text-[10px]">Panels (Per Unit)</p>
                                                    <div className="space-y-2">
                                                        {breakdown.panels.map((p, i) => (
                                                            <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                                <span className="font-bold text-slate-300">{p.name} <span className="text-slate-500 text-[10px]">({p.qty}x)</span></span>
                                                                <span className="font-mono text-indigo-300">{p.l}×{p.w}mm</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="font-bold text-slate-500 uppercase tracking-widest mb-3 text-[10px]">Hardware</p>
                                                        <div className="space-y-2 text-slate-300">
                                                            <p className="flex justify-between"><span>Hinges:</span> <span className="font-bold text-white">{breakdown.hardware.hinges} pr</span></p>
                                                            <p className="flex justify-between"><span>Handles:</span> <span className="font-bold text-white">{breakdown.hardware.doorHandles + breakdown.hardware.drawerHandles}</span></p>
                                                            <p className="flex justify-between"><span>Slides:</span> <span className="font-bold text-white">{breakdown.hardware.drawerSlides} sets</span></p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-500 uppercase tracking-widest mb-3 text-[10px]">Fasteners</p>
                                                        <div className="space-y-2 text-slate-300">
                                                            <p className="flex justify-between"><span>Confirmat:</span> <span className="font-bold text-white">{breakdown.fasteners.confirmatScrews}</span></p>
                                                            <p className="flex justify-between"><span>Cam Locks:</span> <span className="font-bold text-white">{breakdown.fasteners.camLocks}</span></p>
                                                            <p className="flex justify-between"><span>Nails:</span> <span className="font-bold text-white">{breakdown.fasteners.backPanelNails}</span></p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-800">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-bold text-indigo-400 uppercase tracking-tight">Total Edge Banding</span>
                                                        <span className="font-black text-white text-lg">{(breakdown.totalEdgeBand * breakdown.unitCount).toFixed(2)}m</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end sticky bottom-0 backdrop-blur-md rounded-b-[32px]">
                                    <Button onClick={() => setEditingCabinetId(null)} className="rounded-xl px-10 h-12 font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
                {/* Panel Manager Modal */}
                {isPanelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[32px] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] flex flex-col scale-in-95 animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-2xl">
                                        <GripVertical className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Manage Panels</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Custom Cutlist Entries</p>
                                    </div>
                                    <span className="ml-2 text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-wide">
                                        {panels.length} Items
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" onClick={addPanel} className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all gap-2">
                                        <Plus className="w-4 h-4" />
                                        <span>Add Panel</span>
                                    </Button>
                                    <button onClick={() => setIsPanelModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                                        <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-slate-50/50">
                                {panels.length > 0 ? (
                                    <table className="w-full border-separate border-spacing-y-2 px-6 pt-4">
                                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-slate-200/50">
                                            <tr>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">#</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left w-[20%]">Label</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">L (mm)</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">W (mm)</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">Qty</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">Group</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left w-[25%]">Sheet</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {panels.map((p, idx) => (
                                                <tr key={p.id} className="group transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5">
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 rounded-l-2xl border-y border-l border-slate-100 flex items-center px-4 font-mono font-bold text-slate-300 group-hover:border-indigo-100 group-hover:text-indigo-300 transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="text"
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                                                value={p.label || ""}
                                                                onChange={(e) => updatePanel(p.id, "label", e.target.value)}
                                                                placeholder="Unnamed Panel"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-mono font-bold text-slate-700"
                                                                value={p.length || ""}
                                                                onChange={(e) => updatePanel(p.id, "length", Number(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-mono font-bold text-slate-700"
                                                                value={p.width || ""}
                                                                onChange={(e) => updatePanel(p.id, "width", Number(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-20 h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-black text-indigo-600 text-center"
                                                                value={p.quantity || ""}
                                                                onChange={(e) => updatePanel(p.id, "quantity", Number(e.target.value) || 1)}
                                                                min={1}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <select
                                                                className="h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-xs font-bold uppercase text-slate-600 w-full cursor-pointer"
                                                                value={p.materialGroup || ""}
                                                                onChange={(e) => updatePanel(p.id, "materialGroup", e.target.value)}
                                                            >
                                                                <option value="">Default</option>
                                                                <option value="carcass">Carcass</option>
                                                                <option value="doors">Doors</option>
                                                                <option value="backing">Backing</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <select
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-xs font-bold text-slate-600 cursor-pointer"
                                                                value={p.stockSheetId || ""}
                                                                onChange={(e) => updatePanel(p.id, "stockSheetId", e.target.value)}
                                                            >
                                                                <option value="">Default Sheet</option>
                                                                {stockSheets.map(s => (
                                                                    <option key={s.id} value={s.id}>{s.label || `${s.length}×${s.width}mm`}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 rounded-r-2xl border-y border-r border-slate-100 flex items-center justify-end px-4 group-hover:border-indigo-100 transition-colors">
                                                            <button
                                                                onClick={() => removePanel(p.id)}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                            <GripVertical className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-2">No Panels Added</h3>
                                        <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">Add panels manually to customize your cutlist with generic measurements.</p>
                                        <Button variant="outline" size="lg" onClick={addPanel} className="rounded-xl border-dashed border-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 gap-2">
                                            <Plus className="w-5 h-5" />
                                            Add First Panel
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-white/95 backdrop-blur-sm flex justify-between items-center z-10">
                                <span className="text-xs font-bold text-slate-400 italic flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Changes saved automatically
                                </span>
                                <Button
                                    onClick={() => {
                                        saveProject();
                                        setIsPanelModalOpen(false);
                                    }}
                                    className="rounded-xl px-12 h-12 font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Stock Manager Modal */}
                {isStockModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[32px] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] flex flex-col scale-in-95 animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-2xl">
                                        <Layout className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Stock Inventory</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage Sheet Materials</p>
                                    </div>
                                    <span className="ml-2 text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-wide">
                                        {stockSheets.length} Items
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" onClick={addStockSheet} className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all gap-2">
                                        <Plus className="w-4 h-4" />
                                        <span>Add Stock</span>
                                    </Button>
                                    <button onClick={() => setIsStockModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                                        <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-slate-50/50">
                                {stockSheets.length > 0 ? (
                                    <table className="w-full border-separate border-spacing-y-2 px-6 pt-4">
                                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-slate-200/50">
                                            <tr>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">#</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left w-[30%]">Label</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">L ({unitLabel})</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">W ({unitLabel})</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">Thk (mm)</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">Qty</th>
                                                <th className="pb-4 pt-2 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockSheets.map((s, idx) => (
                                                <tr key={s.id} className="group transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5">
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 rounded-l-2xl border-y border-l border-slate-100 flex items-center px-4 font-mono font-bold text-slate-300 group-hover:border-indigo-100 group-hover:text-indigo-300 transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 18mm MDF"
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                                                value={s.label || ""}
                                                                onChange={(e) => updateStockSheet(s.id, "label", e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-mono font-bold text-slate-700"
                                                                value={s.length || ""}
                                                                onChange={(e) => updateStockSheet(s.id, "length", Number(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-mono font-bold text-slate-700"
                                                                value={s.width || ""}
                                                                onChange={(e) => updateStockSheet(s.id, "width", Number(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="number"
                                                                placeholder="18"
                                                                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-mono font-bold text-slate-700"
                                                                value={s.thickness || ""}
                                                                onChange={(e) => updateStockSheet(s.id, "thickness", Number(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 border-y border-slate-100 flex items-center px-2 group-hover:border-indigo-100 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-20 h-10 px-3 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-black text-indigo-600 text-center"
                                                                value={s.quantity || ""}
                                                                onChange={(e) => updateStockSheet(s.id, "quantity", Number(e.target.value) || 1)}
                                                                min={1}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1 px-1">
                                                        <div className="bg-white h-14 rounded-r-2xl border-y border-r border-slate-100 flex items-center justify-end px-4 group-hover:border-indigo-100 transition-colors">
                                                            <button
                                                                onClick={() => removeStockSheet(s.id)}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                            <Layout className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-2">No Stock Added</h3>
                                        <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">Add stock sheets to begin optimizing your cutlists.</p>
                                        <Button variant="outline" size="lg" onClick={addStockSheet} className="rounded-xl border-dashed border-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 gap-2">
                                            <Plus className="w-5 h-5" />
                                            Add First Sheet
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-white/95 backdrop-blur-sm flex justify-between items-center z-10 sticky bottom-0">
                                <span className="text-xs font-bold text-slate-400 italic flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Changes saved automatically
                                </span>
                                <Button
                                    onClick={() => {
                                        saveProject();
                                        setIsStockModalOpen(false);
                                    }}
                                    className="rounded-xl px-12 h-12 font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

                                            {/* Bill of Quantity (BOQ) Section */}
                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => setShowBOQSection(!showBOQSection)}
                                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                                                        <div className="text-left">
                                                            <h3 className="text-sm font-black uppercase tracking-widest">Bill of Quantity</h3>
                                                            <p className="text-[10px] text-muted-foreground font-medium">Material costs, labor & other expenses</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {calculated && (
                                                            <span className="text-sm font-black text-secondary">
                                                                ₱{((usedSheets * LABOR_RATE_PER_BOARD) + transportCost + designFee + miscCosts).toLocaleString()}
                                                            </span>
                                                        )}
                                                        <ChevronDown className={cn(
                                                            "w-5 h-5 text-muted-foreground transition-transform duration-300",
                                                            showBOQSection && "rotate-180"
                                                        )} />
                                                    </div>
                                                </button>

                                                {showBOQSection && (
                                                    <div className="p-6 rounded-2xl bg-muted/30 border border-border/20 space-y-6 animate-in slide-in-from-top-2 duration-300">

                                                        {/* Labor Cost - Auto-calculated */}
                                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Fabrication & Installation Labor</p>
                                                                    <p className="text-[9px] text-muted-foreground mt-0.5">Auto-calculated: {usedSheets} boards × ₱{LABOR_RATE_PER_BOARD.toLocaleString()}/board</p>
                                                                </div>
                                                                <p className="text-2xl font-black text-primary">₱{(usedSheets * LABOR_RATE_PER_BOARD).toLocaleString()}</p>
                                                            </div>
                                                            <p className="text-[9px] text-muted-foreground italic border-t border-primary/10 pt-2 mt-2">
                                                                <span className="font-bold">Note:</span> Fabrication and installation are primarily performed using high-precision portable power tools. Rate is based on industry standard manual fabrication complexity.
                                                            </p>

                                                            {/* CNC Disclaimer & Value Prop */}
                                                            <div className="mt-3 p-3 rounded-lg border border-secondary/20 bg-secondary/[0.03]">
                                                                <p className="text-[10px] font-black uppercase tracking-wider text-secondary flex items-center gap-1.5 mb-1.5">
                                                                    <Cpu className="w-3 h-3" /> Premium CNC Processing (Optional)
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                                                                        CNC precision processing is available for an <span className="text-secondary font-bold">additional fee</span>. Work is processed at our Manila facility, which involves <span className="text-secondary font-bold">additional logistics and handling costs</span>.
                                                                    </p>
                                                                    <div className="pt-1.5 border-t border-secondary/10">
                                                                        <p className="text-[9px] text-primary/80 leading-relaxed font-medium">
                                                                            <span className="text-secondary font-bold italic">The CNC Advantage:</span> It provides extreme 0.1mm dimensional accuracy, perfectly square edges, and nested-based optimization for zero material waste. This ensures a "factory-fit" quality far superior to manual cutting.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Material Acquisition Disclaimer */}
                                                            <div className="mt-2 p-3 rounded-lg border border-primary/10 bg-primary/[0.02]">
                                                                <p className="text-[9px] text-primary/80 leading-relaxed">
                                                                    <span className="font-bold text-primary">Material Sourcing:</span> Clients have the option for <span className="italic">self-acquisition of materials</span> to better align with their specific budget requirements. Please be assured that all materials specified in this BOQ represent the <span className="font-bold">premium grade selections</span> sourced from our direct chain of trusted suppliers, ensuring long-term durability and aesthetic excellence.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Material Pricing Section */}
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/50 border-b border-border/20 pb-2">Board Material Prices</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                {Object.entries(
                                                                    sheetsMetadata.reduce((acc, meta) => {
                                                                        const group = meta.materialGroup || 'general';
                                                                        const label = meta.label || 'Unknown';
                                                                        if (!acc[group]) acc[group] = { count: 0, label };
                                                                        acc[group].count++;
                                                                        return acc;
                                                                    }, {} as Record<string, { count: number; label: string }>)
                                                                ).map(([group, data]) => (
                                                                    <div key={group} className="p-3 rounded-xl bg-background border border-border/30">
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div>
                                                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{group}</p>
                                                                                <p className="text-xs font-bold">{data.count} boards</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="relative">
                                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">₱</span>
                                                                            <input
                                                                                type="number"
                                                                                value={boardPrices[group] || ""}
                                                                                onChange={(e) => setBoardPrices(prev => ({ ...prev, [group]: Number(e.target.value) || 0 }))}
                                                                                className="w-full bg-muted/50 border border-border/40 rounded-lg pl-6 pr-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                                                                                placeholder="per board"
                                                                            />
                                                                        </div>
                                                                        {boardPrices[group] > 0 && (
                                                                            <p className="text-[10px] font-bold text-secondary mt-1 text-right">
                                                                                = ₱{(boardPrices[group] * data.count).toLocaleString()}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Hardware Pricing */}
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 border-b border-border/20 pb-2">Hardware Prices</p>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                {[
                                                                    { key: 'hinges', label: 'Hinges', count: aggregateBOM.hardware.hinges, unit: 'pcs' },
                                                                    { key: 'handles', label: 'Handles', count: aggregateBOM.hardware.handles, unit: 'pcs' },
                                                                    { key: 'slides', label: 'Slides', count: aggregateBOM.hardware.slides, unit: 'sets' },
                                                                    { key: 'shelfPins', label: 'Shelf Pins', count: aggregateBOM.hardware.shelfPins, unit: 'pcs' },
                                                                ].map(item => (
                                                                    <div key={item.key} className="p-3 rounded-xl bg-background border border-border/30">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">{item.label}</p>
                                                                        <p className="text-xs font-bold mb-2">{item.count} {item.unit}</p>
                                                                        <div className="relative">
                                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">₱</span>
                                                                            <input
                                                                                type="number"
                                                                                value={hardwarePrices[item.key as keyof typeof hardwarePrices] || ""}
                                                                                onChange={(e) => setHardwarePrices(prev => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))}
                                                                                className="w-full bg-muted/50 border border-border/40 rounded-lg pl-6 pr-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                                                                                placeholder="/pc"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Fastener Pricing */}
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/70 border-b border-border/20 pb-2">Fastener Prices</p>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                {[
                                                                    { key: 'confirmat', label: 'Confirmat Screws', count: aggregateBOM.fasteners.confirmat },
                                                                    { key: 'camLocks', label: 'Cam Locks', count: aggregateBOM.fasteners.camLocks },
                                                                    { key: 'nails', label: 'Nails', count: aggregateBOM.fasteners.nails },
                                                                ].map(item => (
                                                                    <div key={item.key} className="p-3 rounded-xl bg-background border border-border/30">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">{item.label}</p>
                                                                        <p className="text-xs font-bold mb-2">{item.count} pcs</p>
                                                                        <div className="relative">
                                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">₱</span>
                                                                            <input
                                                                                type="number"
                                                                                value={fastenerPrices[item.key as keyof typeof fastenerPrices] || ""}
                                                                                onChange={(e) => setFastenerPrices(prev => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))}
                                                                                className="w-full bg-muted/50 border border-border/40 rounded-lg pl-6 pr-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                                                                                placeholder="/pc"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Upsell / Additional Items */}
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center border-b border-border/20 pb-2">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Upsell / Additional Items</p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                                                    onClick={addUpsellItem}
                                                                >
                                                                    <Plus className="w-3 h-3 mr-1" /> Add Item
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {upsellItems.length === 0 ? (
                                                                    <div className="p-4 rounded-xl border border-dashed border-border/40 text-center">
                                                                        <p className="text-[10px] text-muted-foreground italic">No additional items added. Click "Add Item" to upsell accessories, lighting, etc.</p>
                                                                    </div>
                                                                ) : (
                                                                    upsellItems.map((item) => (
                                                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-background p-2 rounded-xl border border-border/30">
                                                                            <div className="col-span-6">
                                                                                <input
                                                                                    className="w-full bg-muted/30 border-none rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500/20"
                                                                                    placeholder="Item Name (e.g. Soft Close Hinges)"
                                                                                    value={item.name}
                                                                                    onChange={(e) => setUpsellItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, name: e.target.value } : ui))}
                                                                                />
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full bg-muted/30 border-none rounded-lg px-2 py-1.5 text-xs font-bold text-center"
                                                                                    placeholder="Qty"
                                                                                    value={item.quantity || ""}
                                                                                    onChange={(e) => setUpsellItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, quantity: Number(e.target.value) || 0 } : ui))}
                                                                                />
                                                                            </div>
                                                                            <div className="col-span-3 relative">
                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">₱</span>
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full bg-muted/30 border-none rounded-lg pl-5 pr-2 py-1.5 text-xs font-bold"
                                                                                    placeholder="Price"
                                                                                    value={item.price || ""}
                                                                                    onChange={(e) => setUpsellItems(prev => prev.map(ui => ui.id === item.id ? { ...ui, price: Number(e.target.value) || 0 } : ui))}
                                                                                />
                                                                            </div>
                                                                            <div className="col-span-1 flex justify-center">
                                                                                <button
                                                                                    type="button"
                                                                                    className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-7 text-[10px] px-2 text-destructive hover:bg-destructive/10"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        setUpsellItems(prev => prev.filter(ui => ui.id !== item.id));
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Additional Costs */}
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/70 border-b border-border/20 pb-2">Additional Costs</p>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transportation</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                                                                        <input
                                                                            type="number"
                                                                            value={transportCost || ""}
                                                                            onChange={(e) => setTransportCost(Number(e.target.value) || 0)}
                                                                            className="w-full bg-background border border-border/40 rounded-xl pl-8 pr-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Design Fee</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                                                                        <input
                                                                            type="number"
                                                                            value={designFee || ""}
                                                                            onChange={(e) => setDesignFee(Number(e.target.value) || 0)}
                                                                            className="w-full bg-background border border-border/40 rounded-xl pl-8 pr-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Miscellaneous</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                                                                        <input
                                                                            type="number"
                                                                            value={miscCosts || ""}
                                                                            onChange={(e) => setMiscCosts(Number(e.target.value) || 0)}
                                                                            className="w-full bg-background border border-border/40 rounded-xl pl-8 pr-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Material Markup</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            value={materialMarkup || ""}
                                                                            onChange={(e) => setMaterialMarkup(Number(e.target.value) || 0)}
                                                                            className="w-full bg-background border border-border/40 rounded-xl pl-4 pr-8 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                                                                            placeholder="0"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes / Terms</label>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-[10px] font-bold text-secondary hover:text-secondary hover:bg-secondary/10 rounded-lg"
                                                                    onClick={() => setBoqNotes(BOQ_STANDARD_TERMS)}
                                                                >
                                                                    <FileText className="w-3 h-3 mr-1" /> Load Standard Terms
                                                                </Button>
                                                            </div>
                                                            <textarea
                                                                value={boqNotes}
                                                                onChange={(e) => setBoqNotes(e.target.value)}
                                                                className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all resize-none"
                                                                rows={6}
                                                                placeholder="e.g., 50% downpayment required, delivery within 2-3 weeks..."
                                                            />
                                                        </div>

                                                        {/* BOQ Summary */}
                                                        <div className="p-5 rounded-xl bg-secondary/10 border border-secondary/20 space-y-4">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/70 border-b border-secondary/20 pb-2">Cost Breakdown</p>
                                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium opacity-70">Materials (Boards)</span>
                                                                    <span className="font-bold">₱{Object.entries(boardPrices).reduce((sum, [group, price]) => {
                                                                        const count = sheetsMetadata.filter(m => m.materialGroup === group).length;
                                                                        return sum + (price * count);
                                                                    }, 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium opacity-70">Hardware</span>
                                                                    <span className="font-bold">₱{(
                                                                        (hardwarePrices.hinges * aggregateBOM.hardware.hinges) +
                                                                        (hardwarePrices.handles * aggregateBOM.hardware.handles) +
                                                                        (hardwarePrices.slides * aggregateBOM.hardware.slides) +
                                                                        (hardwarePrices.shelfPins * aggregateBOM.hardware.shelfPins)
                                                                    ).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium opacity-70">Fasteners</span>
                                                                    <span className="font-bold">₱{(
                                                                        (fastenerPrices.confirmat * aggregateBOM.fasteners.confirmat) +
                                                                        (fastenerPrices.camLocks * aggregateBOM.fasteners.camLocks) +
                                                                        (fastenerPrices.nails * aggregateBOM.fasteners.nails)
                                                                    ).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium opacity-70">Labor & Installation</span>
                                                                    <span className="font-bold">₱{(usedSheets * LABOR_RATE_PER_BOARD).toLocaleString()}</span>
                                                                </div>
                                                                {upsellItems.length > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium opacity-70">Upsell / Additional Items</span>
                                                                        <span className="font-bold">₱{upsellItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium opacity-70">Transport + Design + Misc</span>
                                                                    <span className="font-bold">₱{(transportCost + designFee + miscCosts).toLocaleString()}</span>
                                                                </div>
                                                                {materialMarkup > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium opacity-70">Material Markup ({materialMarkup}%)</span>
                                                                        <span className="font-bold text-primary">+₱{(
                                                                            (Object.entries(boardPrices).reduce((sum, [group, price]) => {
                                                                                const count = sheetsMetadata.filter(m => m.materialGroup === group).length;
                                                                                return sum + (price * count);
                                                                            }, 0) +
                                                                                (hardwarePrices.hinges * aggregateBOM.hardware.hinges) +
                                                                                (hardwarePrices.handles * aggregateBOM.hardware.handles) +
                                                                                (hardwarePrices.slides * aggregateBOM.hardware.slides) +
                                                                                (hardwarePrices.shelfPins * aggregateBOM.hardware.shelfPins) +
                                                                                (fastenerPrices.confirmat * aggregateBOM.fasteners.confirmat) +
                                                                                (fastenerPrices.camLocks * aggregateBOM.fasteners.camLocks) +
                                                                                (fastenerPrices.nails * aggregateBOM.fasteners.nails)
                                                                            ) * (materialMarkup / 100)
                                                                        ).toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="border-t border-secondary/30 pt-3 flex justify-between items-center">
                                                                <p className="text-sm font-black uppercase tracking-widest text-secondary">Grand Total</p>
                                                                <p className="text-3xl font-black text-secondary">
                                                                    ₱{(() => {
                                                                        const boardTotal = Object.entries(boardPrices).reduce((sum, [group, price]) => {
                                                                            const count = sheetsMetadata.filter(m => m.materialGroup === group).length;
                                                                            return sum + (price * count);
                                                                        }, 0);
                                                                        const hardwareTotal = (hardwarePrices.hinges * aggregateBOM.hardware.hinges) +
                                                                            (hardwarePrices.handles * aggregateBOM.hardware.handles) +
                                                                            (hardwarePrices.slides * aggregateBOM.hardware.slides) +
                                                                            (hardwarePrices.shelfPins * aggregateBOM.hardware.shelfPins);
                                                                        const fastenerTotal = (fastenerPrices.confirmat * aggregateBOM.fasteners.confirmat) +
                                                                            (fastenerPrices.camLocks * aggregateBOM.fasteners.camLocks) +
                                                                            (fastenerPrices.nails * aggregateBOM.fasteners.nails);
                                                                        const upsellTotal = upsellItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                                                                        const materialTotal = boardTotal + hardwareTotal + fastenerTotal;
                                                                        const markup = materialTotal * (materialMarkup / 100);
                                                                        const laborTotal = usedSheets * LABOR_RATE_PER_BOARD;
                                                                        const additionalTotal = transportCost + designFee + miscCosts;
                                                                        return (materialTotal + markup + laborTotal + additionalTotal + upsellTotal).toLocaleString();
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
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
                                                <div className="flex justify-between items-start border-b-[3px] border-primary pb-8 mb-8">
                                                    <div>
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <img src="https://res.cloudinary.com/dbviya1rj/image/upload/v1757004631/nlir90vrzv0qywleruvv.png" alt="ModuLux" className="h-10 w-auto" />
                                                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-primary">ModuLux <span className="not-italic opacity-50">Fabricator</span></h1>
                                                        </div>
                                                        <p className="text-[9px] font-black opacity-30 tracking-[0.3em] uppercase leading-tight">Automated Production Protocol <br /> Certified Precision Output</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-base font-black uppercase tracking-tight">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mt-1">Ref ID: PRD-{projectId?.substring(0, 6).toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
                                                    </div>
                                                </div>

                                                {/* Project & Client Details */}
                                                <div className="grid grid-cols-2 gap-8 mb-10 p-6 bg-primary/[0.02] rounded-2xl border border-primary/10">
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-2">Project Details</p>
                                                        <h2 className="text-xl font-black tracking-tight text-primary mb-1">{projectName || "Untitled Project"}</h2>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full">
                                                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                                                                {bomSubject === "kitchen" && "Kitchen Cabinetry"}
                                                                {bomSubject === "wardrobe" && "Wardrobe System"}
                                                                {bomSubject === "vanity" && "Vanity Unit"}
                                                                {bomSubject === "entertainment" && "Entertainment Center"}
                                                                {bomSubject === "office" && "Office Furniture"}
                                                                {bomSubject === "custom" && "Custom Build"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-2">Client Information</p>
                                                        {clientName ? (
                                                            <>
                                                                <p className="text-lg font-bold tracking-tight text-primary">{clientName}</p>
                                                                {clientContact && <p className="text-[11px] font-medium opacity-60 text-primary">{clientContact}</p>}
                                                                {clientAddress && <p className="text-[10px] font-medium opacity-40 text-primary mt-1">{clientAddress}</p>}
                                                            </>
                                                        ) : (
                                                            <p className="text-sm font-medium opacity-40 text-primary italic">No client specified</p>
                                                        )}
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
                                <div className="p-6 border-t border-border/20 bg-muted/30 print:hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] hidden md:block">
                                            ModuLux Fabrication Management System
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl px-4"
                                                onClick={() => {
                                                    if (showReportPreview) setShowReportPreview(false);
                                                    else setShowBOMModal(false);
                                                }}
                                            >
                                                {showReportPreview ? "Back to Summary" : "Close"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl px-4 border-primary/20 hover:bg-primary/5"
                                                onClick={() => setShowReportPreview(!showReportPreview)}
                                            >
                                                {showReportPreview ? (
                                                    <><Calculator className="w-4 h-4 mr-2" /> Summary</>
                                                ) : (
                                                    <><FileText className="w-4 h-4 mr-2" /> Preview</>
                                                )}
                                            </Button>
                                            <div className="relative group">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl px-4 border-primary/20 hover:bg-primary/5 group-hover:bg-primary/5"
                                                >
                                                    <Printer className="w-4 h-4 mr-2" /> Print <ChevronDown className="w-3 h-3 ml-1 transition-transform group-hover:rotate-180" />
                                                </Button>
                                                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-border/60 rounded-2xl shadow-2xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 scale-95 group-hover:scale-100 transition-all duration-300 z-[100] origin-bottom-left">
                                                    <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-border/60 rotate-45"></div>
                                                    <button
                                                        className="w-full px-4 py-3 text-left rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center gap-3 relative z-10"
                                                        onClick={() => {
                                                            if (!showReportPreview) {
                                                                setShowReportPreview(true);
                                                                setTimeout(() => handlePrintReport(), 300);
                                                            } else {
                                                                handlePrintReport();
                                                            }
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-[#1e3a2e]">BOM Report</p>
                                                            <p className="text-[10px] text-muted-foreground">Production cutlist</p>
                                                        </div>
                                                    </button>
                                                    <div className="h-px bg-border/40 my-1 mx-2"></div>
                                                    <button
                                                        className="w-full px-4 py-3 text-left rounded-xl text-sm font-semibold hover:bg-secondary/5 transition-colors flex items-center gap-3 relative z-10"
                                                        onClick={() => handlePrintBOQ()}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                            <Calculator className="w-4 h-4 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-[#1a1a1a]">BOQ Quotation</p>
                                                            <p className="text-[10px] text-muted-foreground">Client pricing sheet</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="h-6 w-px bg-border/40 hidden md:block"></div>
                                            <Button
                                                size="sm"
                                                className="rounded-xl px-5 font-bold shadow-lg shadow-primary/20"
                                                onClick={saveProject}
                                            >
                                                <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="rounded-xl px-5 font-bold bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                                                onClick={() => {
                                                    toast.success("BOM Exported to Production Queue");
                                                    setShowBOMModal(false);
                                                }}
                                            >
                                                <Download className="w-4 h-4 mr-2" /> Export
                                            </Button>
                                        </div>
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
                            <div className="bg-card w-full max-w-lg overflow-hidden rounded-3xl border-2 border-primary/20 shadow-2xl scale-in-95 animate-in zoom-in-95 duration-300">
                                <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-black uppercase tracking-tight">Project Settings</h2>
                                        <button onClick={() => setIsProjectSettingsOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    </div>

                                    {/* Project Details Section */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50 border-b border-border/20 pb-2">Project Details</p>
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
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Project Type</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: "kitchen", label: "Kitchen" },
                                                    { value: "wardrobe", label: "Wardrobe" },
                                                    { value: "vanity", label: "Vanity" },
                                                    { value: "entertainment", label: "Entertainment" },
                                                    { value: "office", label: "Office" },
                                                    { value: "custom", label: "Custom" },
                                                ].map((type) => (
                                                    <button
                                                        key={type.value}
                                                        onClick={() => setBomSubject(type.value as typeof bomSubject)}
                                                        className={`px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${bomSubject === type.value
                                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                                            }`}
                                                    >
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                            <p className="text-[10px] font-bold text-primary uppercase mb-1">Project ID</p>
                                            <p className="text-[10px] font-mono opacity-50 truncate">{projectId || "Pending Save..."}</p>
                                        </div>
                                    </div>

                                    {/* Client Details Section */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary/70 border-b border-border/20 pb-2">Client Information</p>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client Name</label>
                                            <input
                                                type="text"
                                                value={clientName}
                                                onChange={(e) => setClientName(e.target.value)}
                                                className="w-full bg-muted/50 border border-border/40 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="e.g., John Smith"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact (Phone/Email)</label>
                                            <input
                                                type="text"
                                                value={clientContact}
                                                onChange={(e) => setClientContact(e.target.value)}
                                                className="w-full bg-muted/50 border border-border/40 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="e.g., +63 917 123 4567"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delivery Address</label>
                                            <textarea
                                                value={clientAddress}
                                                onChange={(e) => setClientAddress(e.target.value)}
                                                className="w-full bg-muted/50 border border-border/40 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                                rows={2}
                                                placeholder="e.g., 123 Main St, Makati City"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => {
                                            saveProject();
                                            setIsProjectSettingsOpen(false);
                                        }}
                                        className="w-full rounded-2xl h-12 font-black uppercase tracking-tight shadow-lg shadow-primary/20"
                                    >
                                        Save & Close
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
                {/* Delete Confirmation Modal */}
                {projectToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setProjectToDelete(null)} />
                        <div className="relative bg-card border border-border/40 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold mb-2">Delete Project</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Are you sure you want to delete <span className="font-bold text-foreground">"{projectToDelete.name}"</span>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setProjectToDelete(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={async () => {
                                        try {
                                            await supabase.from('cutlist_cabinet_configs').delete().eq('project_id', projectToDelete.id);
                                            await supabase.from('cutlist_results').delete().eq('project_id', projectToDelete.id);
                                            const { error } = await supabase.from('cutlist_projects').delete().eq('id', projectToDelete.id);
                                            if (error) throw error;
                                            loadSavedProjects();
                                            if (projectToDelete.id === projectId) startNewProject();
                                            toast.success("Project deleted successfully");
                                        } catch (error: any) {
                                            console.error("Delete Error:", error);
                                            toast.error(`Delete failed: ${error.message}`);
                                        } finally {
                                            setProjectToDelete(null);
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
