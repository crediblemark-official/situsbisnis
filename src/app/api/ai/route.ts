import { NextResponse } from "next/server";
import { generatePageWithAI, generateSectionWithAI, refineFieldWithAI, type AIConfig } from "@crediblemark/build-ai/server";
import presetSchemas from "./schemas.json";
import { SubscriptionClient } from "@/modules/subscription";

/**
 * Resolves the AI provider configuration from database or environment variables.
 *
 * Provider priority (first match wins):
 *   1. Database PlatformSettings
 *   2. OPENROUTER_API_KEY  → provider: "openrouter"
 *   3. GROQ_API_KEY        → provider: "groq"
 *   4. NVIDIA_API_KEY      → provider: "nvidia"
 *   5. OPENAI_API_KEY      → provider: "openai"
 *   6. GEMINI_API_KEY      → provider: "gemini" (default)
 */
let rotationIndex = 0;

interface AIConfigItem {
  provider: string;
  apiKey: string;
  modelName?: string;
}

async function resolveAIConfig(): Promise<AIConfig | null> {
  try {
    const settings = await SubscriptionClient.getPlatformSettings();
    if (settings?.aiApiKey) {
      let configs: AIConfigItem[] = [];
      try {
        const parsed = JSON.parse(settings.aiApiKey);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0) {
            if (typeof parsed[0] === "object" && parsed[0] !== null) {
              configs = parsed
                .map((item: any) => ({
                  provider: String(item.provider || settings.aiProvider || "gemini").trim(),
                  apiKey: String(item.apiKey || "").trim(),
                  modelName: item.modelName ? String(item.modelName).trim() : undefined
                }))
                .filter(item => item.apiKey);
            } else {
              configs = parsed
                .map((k: any) => ({
                  provider: settings.aiProvider || "gemini",
                  apiKey: String(k || "").trim()
                }))
                .filter(item => item.apiKey);
            }
          }
        }
      } catch {
        if (settings.aiApiKey.includes(",")) {
          configs = settings.aiApiKey
            .split(",")
            .map(k => ({
              provider: settings.aiProvider || "gemini",
              apiKey: k.trim()
            }))
            .filter(item => item.apiKey);
        } else if (settings.aiApiKey.trim()) {
          configs = [
            {
              provider: settings.aiProvider || "gemini",
              apiKey: settings.aiApiKey.trim()
            }
          ];
        }
      }

      if (configs.length > 0) {
        const selected = configs[rotationIndex % configs.length];
        rotationIndex = (rotationIndex + 1) % configs.length;
        return {
          apiKey: selected.apiKey,
          provider: selected.provider as any,
          modelName: selected.modelName
        };
      }
    }
  } catch (error) {
    console.error("Failed to read PlatformSettings for AI:", error);
  }

  const getEnvKeys = (envVal?: string): string[] => {
    if (!envVal) return [];
    if (envVal.includes(",")) {
      return envVal.split(",").map(k => k.trim()).filter(Boolean);
    }
    return [envVal.trim()];
  };

  const checkEnv = (envKey: string, provider: string) => {
    const envVal = process.env[envKey];
    if (envVal) {
      const keys = getEnvKeys(envVal);
      if (keys.length > 0) {
        const selected = keys[rotationIndex % keys.length];
        rotationIndex = (rotationIndex + 1) % keys.length;
        return { apiKey: selected, provider: provider as any };
      }
    }
    return null;
  };

  const resOpenRouter = checkEnv("OPENROUTER_API_KEY", "openrouter");
  if (resOpenRouter) return resOpenRouter;

  const resGroq = checkEnv("GROQ_API_KEY", "groq");
  if (resGroq) return resGroq;

  const resNvidia = checkEnv("NVIDIA_API_KEY", "nvidia");
  if (resNvidia) return resNvidia;

  const resOpenai = checkEnv("OPENAI_API_KEY", "openai");
  if (resOpenai) return resOpenai;

  const resGemini = checkEnv("GEMINI_API_KEY", "gemini");
  if (resGemini) return resGemini;

  return null;
}

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
