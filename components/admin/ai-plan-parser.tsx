"use client"

import { useState, useCallback } from "react"
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ExtractedCabinet {
    id: string
    type: "base" | "hanging" | "tall"
    height: number
    depth: number
    width: number
    quantity: number
    confidence: number
    location?: string
}

interface AIPlanParserProps {
    onApply: (cabinets: ExtractedCabinet[]) => void
    onClose: () => void
}

export function AIPlanParser({ onApply, onClose }: AIPlanParserProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [extractedCabinets, setExtractedCabinets] = useState<ExtractedCabinet[]>([])
    const [error, setError] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            validateAndSetFile(droppedFile)
        }
    }, [])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            validateAndSetFile(selectedFile)
        }
    }, [])

    const validateAndSetFile = (file: File) => {
        const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
        const maxSize = 10 * 1024 * 1024 // 10MB

        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload PDF, PNG, or JPG.")
            return
        }

        if (file.size > maxSize) {
            toast.error("File too large. Maximum size is 10MB.")
            return
        }

        setFile(file)
        setError(null)
        setExtractedCabinets([])
    }

    const handleAnalyze = async () => {
        if (!file) return

        setIsProcessing(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/ai/extract-plan", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze plan")
            }

            if (data.cabinets.length === 0) {
                setError("No cabinets detected in the plan. Please try a different image or add cabinets manually.")
            } else {
                setExtractedCabinets(data.cabinets)
                toast.success(`Detected ${data.cabinets.length} cabinet${data.cabinets.length > 1 ? 's' : ''}`)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to analyze plan"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRemoveCabinet = (id: string) => {
        setExtractedCabinets(prev => prev.filter(c => c.id !== id))
    }

    const handleUpdateCabinet = (id: string, field: keyof ExtractedCabinet, value: number | string) => {
        setExtractedCabinets(prev =>
            prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
        )
    }

    const handleApply = () => {
        if (extractedCabinets.length === 0) {
            toast.error("No cabinets to apply")
            return
        }
        onApply(extractedCabinets)
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return "text-green-600"
        if (confidence >= 60) return "text-amber-600"
        return "text-red-600"
    }

    return (
        <div className="space-y-6">
            {/* File Upload Zone */}
            {!file && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                >
                    <input
                        type="file"
                        id="plan-upload"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                    />
                    <label htmlFor="plan-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <div className="text-lg font-semibold mb-2">Upload Architectural Plan</div>
                        <div className="text-sm text-muted-foreground mb-4">
                            Drag and drop or click to browse
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Supported: PDF, PNG, JPG (max 10MB)
                        </div>
                    </label>
                </div>
            )}

            {/* File Selected */}
            {file && !isProcessing && extractedCabinets.length === 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <div>
                                <div className="font-medium">{file.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFile(null)
                                setError(null)
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-destructive">{error}</div>
                        </div>
                    )}

                    <Button onClick={handleAnalyze} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Analyze Plan with AI
                    </Button>
                </div>
            )}

            {/* Processing */}
            {isProcessing && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <div className="text-lg font-semibold mb-2">Analyzing plan...</div>
                    <div className="text-sm text-muted-foreground">
                        This may take 10-30 seconds depending on file size
                    </div>
                </div>
            )}

            {/* Extraction Results */}
            {extractedCabinets.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Detected Cabinets</h3>
                            <p className="text-sm text-muted-foreground">
                                Review and edit before applying to builder
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                            Upload Different Plan
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="text-left p-3 font-semibold">Type</th>
                                    <th className="text-left p-3 font-semibold">Dimensions (mm)</th>
                                    <th className="text-left p-3 font-semibold">Qty</th>
                                    <th className="text-left p-3 font-semibold">Location</th>
                                    <th className="text-left p-3 font-semibold">Confidence</th>
                                    <th className="text-right p-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {extractedCabinets.map((cabinet) => (
                                    <tr key={cabinet.id} className="hover:bg-muted/20">
                                        <td className="p-3">
                                            {editingId === cabinet.id ? (
                                                <select
                                                    value={cabinet.type}
                                                    onChange={(e) => handleUpdateCabinet(cabinet.id, "type", e.target.value)}
                                                    className="p-1 border rounded text-xs capitalize"
                                                >
                                                    <option value="base">Base</option>
                                                    <option value="hanging">Hanging</option>
                                                    <option value="tall">Tall</option>
                                                </select>
                                            ) : (
                                                <span className="capitalize font-medium">{cabinet.type}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingId === cabinet.id ? (
                                                <div className="flex gap-1 text-xs">
                                                    <input
                                                        type="number"
                                                        value={cabinet.height}
                                                        onChange={(e) => handleUpdateCabinet(cabinet.id, "height", Number(e.target.value))}
                                                        className="w-16 p-1 border rounded"
                                                        placeholder="H"
                                                    />
                                                    ×
                                                    <input
                                                        type="number"
                                                        value={cabinet.width}
                                                        onChange={(e) => handleUpdateCabinet(cabinet.id, "width", Number(e.target.value))}
                                                        className="w-16 p-1 border rounded"
                                                        placeholder="W"
                                                    />
                                                    ×
                                                    <input
                                                        type="number"
                                                        value={cabinet.depth}
                                                        onChange={(e) => handleUpdateCabinet(cabinet.id, "depth", Number(e.target.value))}
                                                        className="w-16 p-1 border rounded"
                                                        placeholder="D"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {cabinet.height} × {cabinet.width} × {cabinet.depth}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingId === cabinet.id ? (
                                                <input
                                                    type="number"
                                                    value={cabinet.quantity}
                                                    onChange={(e) => handleUpdateCabinet(cabinet.id, "quantity", Number(e.target.value))}
                                                    className="w-16 p-1 border rounded text-xs"
                                                    min="1"
                                                />
                                            ) : (
                                                <span>{cabinet.quantity}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-muted-foreground">{cabinet.location || "—"}</td>
                                        <td className="p-3">
                                            <span className={cn("font-semibold", getConfidenceColor(cabinet.confidence))}>
                                                {cabinet.confidence}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {editingId === cabinet.id ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        Done
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingId(cabinet.id)}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveCabinet(cabinet.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {extractedCabinets.length} cabinet{extractedCabinets.length > 1 ? 's' : ''} ready to apply
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleApply}>
                                Apply to Builder
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
