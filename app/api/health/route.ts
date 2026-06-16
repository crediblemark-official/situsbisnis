import { NextResponse } from "next/server";
import { db } from "@/lib/core/db";
import { createLogger } from "@/lib/core/logger";

const healthLogger = createLogger("health");

async function checkDatabase(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    healthLogger.error({ error }, "Database health check failed");
    return false;
  }
}

async function checkStorage(): Promise<boolean> {
  try {
    const settings = await db.platformSettings.findUnique({
      where: { id: "global" },
      select: {
        r2AccountId: true,
        r2AccessKeyId: true,
        r2SecretAccessKey: true,
        r2BucketName: true,
      },
    });

    const hasR2Config = !!(
      settings &&
      settings.r2AccountId &&
      settings.r2AccessKeyId &&
      settings.r2SecretAccessKey &&
      settings.r2BucketName
    );
    return hasR2Config;
  } catch (error) {
    healthLogger.error({ error }, "Storage settings health check failed");
    return false;
  }
}

export async function GET() {
  // Pemicu pembersihan memori (Garbage Collection) secara agresif jika berjalan di runtime Bun.
  // Menggunakan globalThis as any agar aman dari error typecheck TypeScript (TS2867).
  const globalAny = globalThis as any;
  if (typeof globalAny.Bun !== "undefined" && typeof globalAny.Bun.gc === "function") {
    globalAny.Bun.gc(true);
  }

  const [dbHealthy, storageHealthy] = await Promise.all([
    checkDatabase(),
    checkStorage(),
  ]);

  // Database is critical for application running. Storage (R2) is optional/informational.
  const isHealthy = dbHealthy;
  const statusCode = isHealthy ? 200 : 503;

  if (!isHealthy) {
    healthLogger.error({ db: dbHealthy }, "Critical database health check failed");
  } else if (!storageHealthy) {
    // Log as info to prevent log pollution from Dokploy's 30s interval healthcheck
    healthLogger.info({ storage: false }, "Storage (R2) is not configured");
  }

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      checks: {
        database: dbHealthy ? "healthy" : "unhealthy",
        storage: storageHealthy ? "configured" : "not-configured",
      },
    },
    { status: statusCode }
  );
}

