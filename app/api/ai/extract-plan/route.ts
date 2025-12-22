import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "")

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

const EXTRACTION_PROMPT = `Analyze this architectural floor plan and extract all kitchen cabinet specifications.

For each cabinet unit, identify:
1. Type: base cabinet, wall/hanging cabinet, or tall cabinet
2. Dimensions: height, width, depth in millimeters
3. Location: which room (kitchen, bedroom, etc.)
4. Quantity: how many identical units

Return data as JSON array with this structure:
[
  {
    "type": "base" | "hanging" | "tall",
    "height": number,
    "width": number,
    "depth": number,
    "quantity": number,
    "location": string,
    "confidence": number (0-100)
  }
]

Focus on standard cabinet dimensions. If measurements are unclear, use industry standards:
- Base cabinets: 720mm height, 600mm depth
- Wall cabinets: 720mm height, 350mm depth
- Tall cabinets: 2100mm height, 600mm depth

Only include cabinets with confidence >= 70%. Return empty array if no cabinets detected.`

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Check API key
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured. Please add GOOGLE_GEMINI_API_KEY to environment variables." },
                { status: 500 }
            )
        }

        // Parse form data
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        // Validate file type
        const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload PDF, PNG, or JPG." },
                { status: 400 }
            )
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            )
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString("base64")

        // Determine mime type for Gemini
        let mimeType = file.type
        if (file.type === "application/pdf") {
            // For PDF, we'll need to convert to image first
            // For now, return error asking for image format
            return NextResponse.json(
                { error: "PDF support coming soon. Please upload PNG or JPG image of the plan." },
                { status: 400 }
            )
        }

        // Call Gemini Vision API
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" })

        const result = await model.generateContent([
            EXTRACTION_PROMPT,
            {
                inlineData: {
                    data: base64,
                    mimeType: mimeType,
                },
            },
        ])

        const response = await result.response
        const text = response.text()

        // Parse JSON response
        let parsedCabinets: any[] = []
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/)
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text
            parsedCabinets = JSON.parse(jsonText)
        } catch (parseError) {
            console.error("Failed to parse AI response:", text)
            return NextResponse.json(
                { error: "Failed to parse AI response. Please try a different image." },
                { status: 500 }
            )
        }

        // Validate and transform cabinets
        const cabinets: ExtractedCabinet[] = parsedCabinets
            .filter((cab: any) => {
                // Filter out invalid entries
                return (
                    cab.type &&
                    ["base", "hanging", "tall"].includes(cab.type) &&
                    cab.height > 0 &&
                    cab.width > 0 &&
                    cab.depth > 0 &&
                    cab.quantity > 0 &&
                    cab.confidence >= 70
                )
            })
            .map((cab: any) => ({
                id: crypto.randomUUID(),
                type: cab.type,
                height: Math.round(cab.height),
                width: Math.round(cab.width),
                depth: Math.round(cab.depth),
                quantity: Math.round(cab.quantity),
                confidence: Math.round(cab.confidence),
                location: cab.location || undefined,
            }))

        const processingTime = Date.now() - startTime
        const avgConfidence = cabinets.length > 0
            ? Math.round(cabinets.reduce((sum, c) => sum + c.confidence, 0) / cabinets.length)
            : 0

        return NextResponse.json({
            success: true,
            cabinets,
            metadata: {
                processingTime,
                fileSize: file.size,
                confidence: avgConfidence,
            },
        })
    } catch (error) {
        console.error("AI extraction error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to analyze plan. Please try again.",
            },
            { status: 500 }
        )
    }
}
