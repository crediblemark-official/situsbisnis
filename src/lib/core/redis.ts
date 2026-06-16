import { env } from "./env";

let redisInstance: any = null;
let isRedisConnectionFailed = false;
let lastConnectionAttempt = 0;
const RETRY_COOLDOWN = 30000; // 30 seconds

// Helper to determine if Redis is configured
export const isRedisAvailable = !!env.REDIS_URL;

/**
 * Gets the active Redis instance. 
 * Resolves lazily to ensure compatibility with Next.js compilation, HMR, and Edge routing.
 */
export async function getRedis() {
    if (!isRedisAvailable) return null;
    
    const now = Date.now();
    if (isRedisConnectionFailed && (now - lastConnectionAttempt < RETRY_COOLDOWN)) {
        return null;
    }
    
    if (redisInstance) return redisInstance;

    // Check if running in Edge Runtime
    const isEdge = typeof process === "undefined" || !process.versions || !process.versions.node;
    if (isEdge) {
        // TCP Sockets are disabled in Edge Runtime.
        // Fall back to memory or log warning.
        return null;
    }

    try {
        lastConnectionAttempt = now;
        const { default: Redis } = await import("ioredis");
        
        redisInstance = new Redis(env.REDIS_URL!, {
            maxRetriesPerRequest: 0, // Fail fast
            connectTimeout: 1000,    // 1 second connection timeout
            reconnectOnError: (err) => {
                const targetError = "READONLY";
                if (err.message.slice(0, targetError.length) === targetError) {
                    return true;
                }
                return false;
            }
        });

        redisInstance.on("error", (err: any) => {
            console.warn("[Redis Connection Warning]:", err.message || err);
            isRedisConnectionFailed = true;
            if (redisInstance) {
                try {
                    redisInstance.disconnect();
                } catch (_) {}
                redisInstance = null;
            }
        });

        redisInstance.on("connect", () => {
            isRedisConnectionFailed = false;
        });

        return redisInstance;
    } catch (error) {
        console.error("Failed to load ioredis dynamic import:", error);
        isRedisConnectionFailed = true;
        redisInstance = null;
        return null;
    }
}
