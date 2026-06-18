import { NextResponse } from "next/server";
import { AIClient } from "../index";
import presetSchemas from "../schemas.json";

export async function processAIApi(req: Request) {
    const aiConfig = await AIClient.resolveAIConfig();

    if (!aiConfig) {
        return NextResponse.json(
            {
                error:
                    "No AI API key is configured. Please add one of the following to your .env: GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, or NVIDIA_API_KEY.",
            },
            { status: 500 },
        );
    }

    try {
        const { prompt, mode, currentData, schemas } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const componentSchemas = schemas || presetSchemas;
        const result = await AIClient.processAIRequest(aiConfig, { prompt, mode, currentData, schemas: componentSchemas });
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API AI Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
    }
}
