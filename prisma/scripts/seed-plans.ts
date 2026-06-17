import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      id: "cmoy7zm1a0000j20j88ablncm",
      name: "Free",
      description: "Paket gratis selamanya untuk mencoba fitur dasar kami.",
      price: 0,
      priceYearly: null,
      originalPrice: 0,
      originalPriceYearly: 0,
      trialDays: 0,
      interval: "month",
      features: {
        hasBlog: false,
        hasCart: false,
        hasInbox: false,
        hasOrders: false,
        hasGallery: false,
        hasProducts: false,
        hasPortfolio: false,
        hasTaxonomies: false,
        addonSitePrice: 0,
        hasCustomDomain: false,
        hasTestimonials: false
      },
      maxPosts: -1,
      maxProducts: -1,
      maxAssets: -1,
      maxTestimonials: -1,
      maxOrders: -1,
      maxSites: -1,
      addonSiteBilling: "one_time",
      showInPricing: false
    },
    {
      id: "cmoxs0xd80001iexi3fqb19qy",
      name: "Pro",
      description: "Solusi profesional untuk bisnis yang sedang berkembang.",
      price: 99000,
      priceYearly: 999000,
      originalPrice: 150000,
      originalPriceYearly: 3000000,
      trialDays: 14,
      interval: "month",
      features: {
        hasBlog: true,
        hasCart: true,
        hasInbox: true,
        hasOrders: true,
        hasGallery: true,
        hasProducts: true,
        hasPortfolio: true,
        hasTaxonomies: true,
        addonSitePrice: 50000,
        hasCustomDomain: true,
        hasTestimonials: true
      },
      maxPosts: 10,
      maxProducts: 10,
      maxAssets: 50,
      maxTestimonials: 10,
      maxOrders: -1,
      maxSites: 1,
      addonSiteBilling: "recurring",
      showInPricing: true
    },
    {
      id: "cmoxs0xju0002iexin4dsottn",
      name: "Agency",
      description: "Skalabilitas tanpa batas untuk korporasi dan agensi.",
      price: 450000,
      priceYearly: 4999000,
      originalPrice: 700000,
      originalPriceYearly: 8400000,
      trialDays: 14,
      interval: "month",
      features: {
        hasBlog: true,
        hasCart: true,
        hasInbox: true,
        hasOrders: true,
        hasGallery: true,
        hasProducts: true,
        hasPortfolio: true,
        hasTaxonomies: true,
        addonSitePrice: 50000,
        hasCustomDomain: true,
        hasTestimonials: true
      },
      maxPosts: -1,
      maxProducts: -1,
      maxAssets: -1,
      maxTestimonials: -1,
      maxOrders: -1,
      maxSites: -1,
      addonSiteBilling: "recurring",
      showInPricing: true
    }
  ];

  console.log("🚀 Seeding default plans...");

  for (const plan of plans) {
    const upserted = await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        price: plan.price,
        priceYearly: plan.priceYearly,
        originalPrice: plan.originalPrice,
        originalPriceYearly: plan.originalPriceYearly,
        trialDays: plan.trialDays,
        interval: plan.interval,
        features: plan.features,
        maxPosts: plan.maxPosts,
        maxProducts: plan.maxProducts,
        maxAssets: plan.maxAssets,
        maxTestimonials: plan.maxTestimonials,
        maxOrders: plan.maxOrders,
        maxSites: plan.maxSites,
        addonSiteBilling: plan.addonSiteBilling,
        showInPricing: plan.showInPricing,
      },
      create: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        priceYearly: plan.priceYearly,
        originalPrice: plan.originalPrice,
        originalPriceYearly: plan.originalPriceYearly,
        trialDays: plan.trialDays,
        interval: plan.interval,
        features: plan.features,
        maxPosts: plan.maxPosts,
        maxProducts: plan.maxProducts,
        maxAssets: plan.maxAssets,
        maxTestimonials: plan.maxTestimonials,
        maxOrders: plan.maxOrders,
        maxSites: plan.maxSites,
        addonSiteBilling: plan.addonSiteBilling,
        showInPricing: plan.showInPricing,
      }
    });
    console.log(`✅ Plan '${upserted.name}' ready.`);
  }

  console.log("✨ Default plans seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
