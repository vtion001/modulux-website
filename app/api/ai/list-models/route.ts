import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET() {
    try {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

        // List all available models
        const models = await genAI.listModels()

        return NextResponse.json({
            models: models.map(m => ({
                name: m.name,
                displayName: m.displayName,
                description: m.description,
                supportedGenerationMethods: m.supportedGenerationMethods,
            }))
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to list models" },
            { status: 500 }
        )
    }
}
