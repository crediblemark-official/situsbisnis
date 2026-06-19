import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah produk aktif di suatu situs.
 */
export async function countProducts(siteId: string): Promise<number> {
    return db.product.count({
        where: { siteId, isArchived: false }
    });
}

/**
 * Mengambil informasi produk berdasarkan daftar productId.
 */
export async function findProductsByIds(productIds: string[]) {
    const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
            name: true,
            images: true,
            price: true,
            currency: true,
        }
    });
    const metaData = await db.metaData.findMany({
        where: { productId: { in: productIds } },
        select: { key: true, value: true, productId: true }
    });
    const metaMap = new Map<string, { key: string; value: string }[]>();
    for (const md of metaData) {
        if (!metaMap.has(md.productId)) metaMap.set(md.productId, []);
        metaMap.get(md.productId)!.push({ key: md.key, value: md.value });
    }
    return products.map(p => ({ ...p, metaData: metaMap.get(p.id) ?? [] }));
}

/**
 * Mencari produk berdasarkan query teks (nama atau slug).
 */
export async function searchProducts(siteId: string, q: string, limit = 5) {
    return db.product.findMany({
        where: {
            siteId,
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
            ]
        },
        take: limit,
        select: { id: true, name: true }
    });
}

/**
 * Mengambil daftar produk aktif (tidak diarsipkan) di suatu situs.
 */
export async function findPublishedProducts(siteId: string) {
    return db.product.findMany({
        where: { isArchived: false, siteId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            images: true,
            createdAt: true,
            stock: true,
        }
    });
}

/**
 * Mencari produk berdasarkan slug lengkap dengan metadata, term, dan seoMeta.
 */
export async function findProductBySlug(siteId: string, slug: string) {
    const product = await db.product.findUnique({
        where: { siteId_slug: { siteId, slug } }
    });
    if (!product) return null;
    const metaData = await db.metaData.findMany({ where: { productId: product.id } });
    const seoMeta = await db.seoMeta.findFirst({ where: { productId: product.id } });
    return { ...product, metaData, seoMeta };
}
