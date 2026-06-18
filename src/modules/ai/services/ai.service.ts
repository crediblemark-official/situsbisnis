import { generatePageWithAI, generateSectionWithAI, refineFieldWithAI, type AIConfig } from "@crediblemark/build-ai/server";

interface AIRequest {
    prompt: string;
    mode: "page" | "section" | "refine";
    currentData?: any;
    schemas?: any[];
}

export async function processAIRequest(aiConfig: AIConfig, { prompt, mode, currentData, schemas }: AIRequest) {
    if (mode === "page") {
        return generatePageWithAI(prompt, schemas, aiConfig, currentData);
    } else if (mode === "section") {
        return generateSectionWithAI(prompt, schemas, aiConfig, currentData);
    } else if (mode === "refine") {
        return refineFieldWithAI(prompt, currentData, aiConfig);
    }
    throw new Error("Invalid mode specified");
}
