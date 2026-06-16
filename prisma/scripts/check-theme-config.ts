import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.siteSettings.findFirst({
        where: { siteId: "cmp3twfmn0002y7pd4fu6c51o" }
    });
    console.log("Settings fields:", {
        logoUrl: settings?.logoUrl,
        faviconUrl: settings?.faviconUrl,
        themeConfig: settings?.themeConfig
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
