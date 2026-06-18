import { type AIConfig } from "@crediblemark/build-ai/server";
import { SubscriptionClient } from "@/modules/subscription";
import { getRedis } from "@/modules/shared/core/redis";

let localIndex = 0;

async function getNextIndex(key: string, limit: number): Promise<number> {
  try {
    const redis = await getRedis();
    if (redis) {
      const val = await redis.incr(key);
      return val % limit;
    }
  } catch (error) {
    console.warn("Failed to increment rotation index in Redis, falling back to local counter:", error);
  }
  const index = localIndex % limit;
  localIndex = (localIndex + 1) % limit;
  return index;
}

interface AIConfigItem {
  provider: string;
  apiKey: string;
  modelName?: string;
}

export async function resolveAIConfig(): Promise<AIConfig | null> {
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
        const index = await getNextIndex("ai_rotation_index:db", configs.length);
        const selected = configs[index];
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

  const checkEnv = async (envKey: string, provider: string) => {
    const envVal = process.env[envKey];
    if (envVal) {
      const keys = getEnvKeys(envVal);
      if (keys.length > 0) {
        const index = await getNextIndex(`ai_rotation_index:env:${envKey}`, keys.length);
        const selected = keys[index];
        return { apiKey: selected, provider: provider as any };
      }
    }
    return null;
  };

  const resOpenRouter = await checkEnv("OPENROUTER_API_KEY", "openrouter");
  if (resOpenRouter) return resOpenRouter;

  const resGroq = await checkEnv("GROQ_API_KEY", "groq");
  if (resGroq) return resGroq;

  const resNvidia = await checkEnv("NVIDIA_API_KEY", "nvidia");
  if (resNvidia) return resNvidia;

  const resOpenai = await checkEnv("OPENAI_API_KEY", "openai");
  if (resOpenai) return resOpenai;

  const resGemini = await checkEnv("GEMINI_API_KEY", "gemini");
  if (resGemini) return resGemini;

  return null;
}
