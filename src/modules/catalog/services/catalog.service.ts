import * as catalogRepo from "../repositories/catalog.repository";

/**
 * Menghitung jumlah produk aktif di suatu situs.
 */
export async function countProducts(siteId: string): Promise<number> {
    return catalogRepo.countProducts(siteId);
}

/**
 * Mengambil peta informasi produk berdasarkan daftar productId.
 */
export async function getProductsMap(productIds: string[]): Promise<Record<string, any>> {
    if (productIds.length === 0) return {};

    const products = await catalogRepo.findProductsByIds(productIds);
    const resultMap: Record<string, any> = {};
    products.forEach(p => {
        resultMap[p.id] = p;
    });

    return resultMap;
}

/**
 * Mencari produk aktif di suatu situs berdasarkan kata kunci.
 */
export async function searchProducts(siteId: string, q: string, limit = 5) {
    return catalogRepo.searchProducts(siteId, q, limit);
}

/**
 * Mengambil seluruh produk aktif di suatu situs.
 */
export async function getProducts(siteId: string) {
    return catalogRepo.findPublishedProducts(siteId);
}

/**
 * Mengambil detail produk berdasarkan slug di suatu situs.
 */
export async function getProduct(slug: string, siteId: string) {
    return catalogRepo.findProductBySlug(siteId, slug);
}
