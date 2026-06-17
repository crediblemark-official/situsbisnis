import { NextResponse } from "next/server";
import { generatePageWithAI, generateSectionWithAI, refineFieldWithAI } from "@crediblemark/build-ai/server";
import presetSchemas from "./schemas.json";
import { resolveAIConfig } from "@/modules/page/services/ai-config.service";

export async function POST(req: Request) {
  const aiConfig = await resolveAIConfig();

  if (!aiConfig) {
    return NextResponse.json(
      {
        error: "No AI API key is configured. Please add one of the following to your .env: GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, or NVIDIA_API_KEY.",
      },
      { status: 500 }
    );
  }

  try {
    const { prompt, mode, currentData, schemas } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Use schemas from request body, or fall back to presetSchemas
    const componentSchemas = schemas || presetSchemas;

    if (mode === "page") {
      const result = await generatePageWithAI(prompt, componentSchemas, aiConfig, currentData);
      return NextResponse.json(result);
    } else if (mode === "section") {
      const result = await generateSectionWithAI(prompt, componentSchemas, aiConfig, currentData);
      return NextResponse.json(result);
    } else if (mode === "refine") {
      const result = await refineFieldWithAI(prompt, currentData, aiConfig);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Invalid mode specified" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("API AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
  }
}
