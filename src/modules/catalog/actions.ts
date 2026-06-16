import * as catalogService from "./services/catalog.service";

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
