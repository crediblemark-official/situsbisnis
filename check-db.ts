import { db } from "./src/modules/shared/core/db";

async function main() {
  const sites = await db.site.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true
    }
  });
  console.log("Registered Sites:", JSON.stringify(sites, null, 2));
}

main().catch(console.error);
