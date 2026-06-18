import { processAIRequest } from "./services/ai.service";
import { resolveAIConfig } from "./services/ai-config.service";

export const AIClient = {
    processAIRequest,
    resolveAIConfig,
};
