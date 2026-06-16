import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Meningkatkan semua batas kuota (limits) di database...");
    
    // Update all plans to have unlimited limits (-1)
    const plansUpdate = await prisma.plan.updateMany({
        data: {
            maxAssets: -1,
            maxPosts: -1,
            maxProducts: -1,
            maxTestimonials: -1,
            maxOrders: -1,
            maxSites: -1,
        }
    });
    console.log(`✅ Berhasil meningkatkan batas kuota pada ${plansUpdate.count} paket layanan.`);
    
    console.log("✨ Semua batas kuota telah diatur menjadi tanpa batas (-1)!");
}

main()
    .catch((e) => {
        console.error("❌ Terjadi kesalahan saat meningkatkan batas kuota:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
