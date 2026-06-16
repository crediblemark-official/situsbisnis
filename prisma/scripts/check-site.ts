import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Memeriksa data Site di database...");
    
    const sites = await prisma.site.findMany({
        include: {
            siteSettings: true
        }
    });
    
    console.log(JSON.stringify(sites, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
