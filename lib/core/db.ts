import { PrismaClient } from "@prisma/client";

const createPrismaClient = () => {
    let dbUrl = process.env.DATABASE_URL || "";
    const isDev = process.env.NODE_ENV === "development";
    
    // Membaca batas koneksi database dari env jika disediakan, default ke 5 (dev) atau 25 (prod)
    const limit = process.env.DATABASE_CONNECTION_LIMIT 
        ? parseInt(process.env.DATABASE_CONNECTION_LIMIT) 
        : (isDev ? 5 : 25);
    const timeout = isDev ? 30 : 15;
    
    if (dbUrl) {
        if (!dbUrl.includes("connection_limit")) {
            const separator = dbUrl.includes("?") ? "&" : "?";
            dbUrl = `${dbUrl}${separator}connection_limit=${limit}&pool_timeout=${timeout}`;
        } else {
            // Pengamanan tingkat lanjut (self-healing): jika connection_limit diatur terlalu rendah (misal: 1 atau 2),
            // paksa naikkan nilainya ke batas aman (limit) agar tidak terjadi bottleneck/antrean database.
            dbUrl = dbUrl.replace(/([?&]connection_limit=)[1-2]([&]|$)/, `$1${limit}$2`);
            dbUrl = dbUrl.replace(/([?&]connection_limit=)[1-2]$/, `$1${limit}`);
        }

        if (!dbUrl.includes("pool_timeout")) {
            const separator = dbUrl.includes("?") ? "&" : "?";
            dbUrl = `${dbUrl}${separator}pool_timeout=${timeout}`;
        }
    }
    
    return new PrismaClient({
        datasources: {
            db: {
                url: dbUrl,
            },
        },
        log: isDev ? ["error", "warn"] : ["error"],
    });
};

declare const globalThis: {
    prismaGlobal: ReturnType<typeof createPrismaClient> | undefined;
} & typeof global;

// Use globalThis pattern to prevent connection proliferation during HMR
// This ensures only ONE PrismaClient instance exists across all hot reloads
export const db: PrismaClient = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = db;
}

