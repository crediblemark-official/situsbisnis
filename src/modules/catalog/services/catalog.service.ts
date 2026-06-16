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
