import * as catalogService from "../services/catalog.service";

/**
 * Menghitung jumlah produk aktif di suatu situs.
 */
export async function countProductsInternal(siteId: string): Promise<number> {
    return catalogService.countProducts(siteId);
}

/**
 * Mengambil peta informasi produk berdasarkan daftar productId.
 */
export async function getProductsMapInternal(productIds: string[]): Promise<Record<string, any>> {
    return catalogService.getProductsMap(productIds);
}

/**
 * Mencari produk di suatu situs.
 */
export async function searchProductsInternal(siteId: string, q: string, limit = 5) {
    return catalogService.searchProducts(siteId, q, limit);
}

/**
 * Mengambil seluruh produk aktif di suatu situs.
 */
export async function getProductsInternal(siteId: string) {
    return catalogService.getProducts(siteId);
}

/**
 * Mengambil detail produk berdasarkan slug di suatu situs.
 */
export async function getProductInternal(slug: string, siteId: string) {
    return catalogService.getProduct(slug, siteId);
}
