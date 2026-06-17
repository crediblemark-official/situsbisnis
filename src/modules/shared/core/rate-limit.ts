import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createLogger } from "@/lib/core/logger";
import { getRedis, isRedisAvailable } from "./redis";

const logger = createLogger("rate-limit");

interface RateLimitConfig {
  max: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const defaultConfig: RateLimitConfig = {
  max: 100,
  windowMs: 15 * 60 * 1000,
};

const authConfig: RateLimitConfig = {
  max: (process.env.NODE_ENV === "test" || process.env.VITEST) ? 20 : 500, // Stricter limit of 20 in tests, 500 in local dev to handle HMR and multi-tab
  windowMs: 15 * 60 * 1000,
};

function getConfig(path: string): RateLimitConfig {
  if (path.startsWith("/api/auth/")) return authConfig;
  if (path.startsWith("/api/health")) return { max: 200, windowMs: 60 * 1000 };
  if (path.startsWith("/api/")) return defaultConfig;
  // Halaman publik (SSR tenant): lebih longgar tapi tetap terlindungi
  return { max: 300, windowMs: 60 * 1000 }; // 300 req/menit per IP
}

function getClientIp(req: NextRequest): string {
  // Prioritaskan header tepercaya: Cloudflare > x-real-ip > x-forwarded-for > fallback
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Standard In-Memory rate limiter fallback
 */
const MAX_STORE_SIZE = 5000; // Batas maksimum entri unik di dalam Map lokal untuk menjaga penggunaan RAM

function checkInMemoryRateLimit(ip: string, config: RateLimitConfig, keySuffix: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `ratelimit:${ip}:${keySuffix}`;
  let entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // Jika ukuran Map melebihi batas maksimum, bersihkan entri yang sudah kedaluwarsa
    if (store.size >= MAX_STORE_SIZE) {
      for (const [k, v] of store.entries()) {
        if (now > v.resetTime) {
          store.delete(k);
        }
      }
      
      // Jika setelah dibersihkan masih penuh, hapus entri tertua sebagai strategi pembersihan darurat (FIFO)
      if (store.size >= MAX_STORE_SIZE) {
        logger.warn("Memory rate limit store is full, evicting oldest entry to prevent RAM leakage");
        const oldestKey = store.keys().next().value;
        if (oldestKey) {
          store.delete(oldestKey);
        }
      }
    }

    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(key, entry);
    return { allowed: true, remaining: config.max - 1, resetTime: entry.resetTime };
  }

  entry.count += 1;

  if (entry.count > config.max) {
    logger.warn({ ip, count: entry.count, max: config.max }, "Memory rate limit exceeded");
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  return { allowed: true, remaining: config.max - entry.count, resetTime: entry.resetTime };
}

/**
 * Distributed Upstash REST API Rate Limiter (Edge-compatible)
 */
async function checkUpstashRateLimit(ip: string, config: RateLimitConfig, keySuffix: string): Promise<{ allowed: boolean; remaining: number; resetTime: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const redisKey = `ratelimit:${ip}:${keySuffix}`;
    const now = Date.now();
    const expireSeconds = Math.ceil(config.windowMs / 1000);

    // Call Upstash via HTTP REST
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["TTL", redisKey]
      ]),
      // Low timeout to keep middleware extremely fast
      signal: AbortSignal.timeout(1000)
    });

    if (!response.ok) return null;

    const data = await response.json();
    const count = data[0]?.result;
    let ttl = data[1]?.result;

    // Set expiration if new key
    if (count === 1 || ttl < 0) {
      await fetch(`${url}/EXPIRE/${redisKey}/${expireSeconds}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(500)
      }).catch(() => {});
      ttl = expireSeconds;
    }

    const remaining = Math.max(0, config.max - count);
    const resetTime = now + (ttl * 1000);

    return {
      allowed: count <= config.max,
      remaining,
      resetTime
    };
  } catch (err) {
    logger.warn({ err }, "Upstash rate limiter failed, falling back to memory");
    return null;
  }
}

/**
 * Distributed ioredis Rate Limiter (Node.js API Route compatible)
 */
async function checkIoredisRateLimit(ip: string, config: RateLimitConfig, keySuffix: string): Promise<{ allowed: boolean; remaining: number; resetTime: number } | null> {
  try {
    const redis = await getRedis();
    if (!redis) return null;

    const redisKey = `ratelimit:${ip}:${keySuffix}`;
    const now = Date.now();
    const expireSeconds = Math.ceil(config.windowMs / 1000);

    const multi = redis.multi();
    multi.incr(redisKey);
    multi.ttl(redisKey);

    const results = await multi.exec();
    if (!results) return null;

    const count = results[0][1] as number;
    let ttl = results[1][1] as number;

    if (count === 1 || ttl < 0) {
      await redis.expire(redisKey, expireSeconds);
      ttl = expireSeconds;
    }

    const remaining = Math.max(0, config.max - count);
    const resetTime = now + (ttl * 1000);

    return {
      allowed: count <= config.max,
      remaining,
      resetTime
    };
  } catch (err) {
    logger.warn({ err }, "ioredis rate limiter failed, falling back to memory");
    return null;
  }
}

function cleanupExpiredEntries() {
  const now = Date.now();
  const keys = Array.from(store.keys());
  for (const key of keys) {
    const entry = store.get(key);
    if (entry && now > entry.resetTime) {
      store.delete(key);
    }
  }
}

const interval = setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
if (typeof interval.unref === "function") {
  interval.unref();
}

/**
 * Next.js Middleware rate limiter interface.
 * Can be run asynchronously.
 */
export async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
  // Bypass rate limiting in development mode to prevent HMR/local test blockages
  // but keep it enabled during E2E testing
  if (process.env.NODE_ENV === "development" && process.env.IS_E2E !== "true") {
    return null;
  }

  const { pathname } = req.nextUrl;

  // Kecualikan asset statis, dashboard, admin, dan editor builder agar tidak terkena rate limit
  const isApiRoute = pathname.startsWith("/api/");
  const isExcludedRoute =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/credbuild");

  if (isExcludedRoute) {
    return null;
  }

  const ip = getClientIp(req);
  const config = getConfig(pathname);
  
  // Tentukan keySuffix yang unik per jenis konfigurasi rute untuk menghindari tabrakan data cache
  let keySuffix = "default";
  if (pathname.startsWith("/api/auth/")) {
    keySuffix = "auth";
  } else if (pathname.startsWith("/api/health")) {
    keySuffix = "health";
  } else if (pathname.startsWith("/api/")) {
    keySuffix = "api";
  } else {
    keySuffix = "public";
  }

  let limitResult = null;

  // 1. Coba gunakan Upstash HTTP REST jika terkonfigurasi (aman untuk Edge runtime)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    limitResult = await checkUpstashRateLimit(ip, config, keySuffix);
  }

  // 2. Coba gunakan TCP Redis standar (jawa di lingkungan serverless Node.js)
  if (!limitResult && isRedisAvailable) {
    limitResult = await checkIoredisRateLimit(ip, config, keySuffix);
  }

  // 3. Fallback ke memori lokal berkinerja tinggi
  if (!limitResult) {
    limitResult = checkInMemoryRateLimit(ip, config, keySuffix);
  }

  const { allowed, remaining, resetTime } = limitResult;

  if (!allowed) {
    logger.warn({ ip, pathname }, "Request diblokir oleh rate limiter");
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Jika diperbolehkan:
  // - Untuk API routes: kembalikan NextResponse.next() dengan header rate limit (untuk kebutuhan testing/klien)
  // - Untuk halaman publik (non-API): kembalikan null agar proxy.ts tidak terhenti awal dan melanjutkan routing
  if (isApiRoute) {
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", config.max.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.floor(resetTime / 1000).toString());
    return response;
  }

  return null;
}
