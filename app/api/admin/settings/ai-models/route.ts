import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api/utils";

export async function POST(req: Request) {
    try {
        const { error, status } = await getApiContext(["admin"]);
        if (error) {
            return NextResponse.json({ error }, { status });
        }

        const { provider, apiKey } = await req.json();
        if (!apiKey || !apiKey.trim()) {
            return NextResponse.json({ models: [] });
        }

        const trimmedKey = apiKey.trim();
        let models: string[] = [];

        if (provider === "gemini") {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`);
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
            }
            const data = await res.json();
            if (Array.isArray(data.models)) {
                models = data.models
                    .map((m: any) => m.name.replace(/^models\//, ""))
                    .filter((name: string) => name.includes("gemini") || name.includes("text"));
            }
        } else {
            let url = "";
            if (provider === "openai") url = "https://api.openai.com/v1/models";
            else if (provider === "openrouter") url = "https://openrouter.ai/api/v1/models";
            else if (provider === "groq") url = "https://api.groq.com/openai/v1/models";
            else if (provider === "nvidia") url = "https://integrate.api.nvidia.com/v1/models";
            else url = "https://api.openai.com/v1/models";

            const res = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${trimmedKey}`,
                },
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`${provider} API returned status ${res.status}: ${errText}`);
            }

            const data = await res.json();
            if (Array.isArray(data.data)) {
                models = data.data.map((m: any) => m.id);
            }
        }

        // Sort models alphabetically for clean rendering
        models.sort();

        return NextResponse.json({ models });
    } catch (err: any) {
        console.error("Fetch models error:", err);
        return NextResponse.json({ error: err.message || "Failed to fetch models" }, { status: 500 });
    }
}
