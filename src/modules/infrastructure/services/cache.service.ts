import { getRedis } from "@/modules/shared/core/redis";

/**
 * Mendapatkan data dari cache Redis berdasarkan kunci (key) yang diberikan.
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const redis = await getRedis();
        if (!redis) return null;
        
        const data = await redis.get(key);
        if (!data) return null;
        
        return JSON.parse(data) as T;
    } catch (error) {
        console.error(`[CACHE_GET_ERROR] Key: ${key}`, error);
        return null;
    }
}

/**
 * Menyimpan data ke dalam cache Redis dengan batas waktu kedaluwarsa (TTL).
 */
export async function setCache<T>(key: string, value: T, ttlInSeconds = 300): Promise<boolean> {
    try {
        const redis = await getRedis();
        if (!redis) return false;
        
        const serialized = JSON.stringify(value);
        await redis.setex(key, ttlInSeconds, serialized);
        return true;
    } catch (error) {
        console.error(`[CACHE_SET_ERROR] Key: ${key}`, error);
        return false;
    }
}

/**
 * Menghapus data dari cache Redis berdasarkan kunci (key).
 */
export async function deleteCache(key: string): Promise<boolean> {
    try {
        const redis = await getRedis();
        if (!redis) return false;
        
        await redis.del(key);
        return true;
    } catch (error) {
        console.error(`[CACHE_DELETE_ERROR] Key: ${key}`, error);
        return false;
    }
}

/**
 * Pola High-level Cache Aside (Get-or-Set) terdistribusi.
 * Mengambil dari cache terlebih dahulu; jika "miss", eksekusi fungsi pengambilan data segar dan simpan hasilnya ke cache.
 */
export async function getOrSetCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlInSeconds = 300
): Promise<T> {
    const cachedData = await getCache<T>(key);
    if (cachedData !== null) {
        return cachedData;
    }
    
    const freshData = await fetchFn();
    await setCache<T>(key, freshData, ttlInSeconds);
    return freshData;
}
