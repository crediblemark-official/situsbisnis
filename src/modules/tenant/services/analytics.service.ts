import * as tenantRepo from "../repositories/tenant.repository";
import { getRedis, isRedisAvailable } from "@/modules/shared/core/redis";

export interface AnalyticsStats {
    siteId: string;
    totalViews: number;
    todayViews: number;
    lastUpdated: Date;
}

/**
 * Mendapatkan dan meningkatkan jumlah view situs menggunakan caching Redis
 * dengan strategi write-throttle, serta fallback ke PostgreSQL.
 */
export async function getOrIncrementViews(siteId: string): Promise<AnalyticsStats> {
    if (!siteId) {
        return { siteId, totalViews: 0, todayViews: 0, lastUpdated: new Date() };
    }

    if (isRedisAvailable) {
        try {
            const redis = await getRedis();
            if (redis) {
                const totalKey = `analytics:total_views:${siteId}`;
                const todayKey = `analytics:today_views:${siteId}`;
                const lastKey = `analytics:last_updated:${siteId}`;
                const syncKey = `analytics:sync:${siteId}`;

                // Cek cache availability
                const totalViewsStr = await redis.get(totalKey);

                if (totalViewsStr === null) {
                    // Cache miss: Load initial values dari PostgreSQL
                    const stats = await tenantRepo.findSiteStatistics(siteId);
                    const today = new Date();

                    if (!stats) {
                        // Buat data statistik baru di database
                        const newStats = await tenantRepo.createSiteStatistics({
                            siteId,
                            totalViews: 1,
                            todayViews: 1,
                            lastUpdated: today
                        });

                        // Populate Redis
                        await redis.set(totalKey, "1");
                        await redis.set(todayKey, "1");
                        await redis.set(lastKey, today.toISOString());
                        await redis.set(syncKey, "1", "EX", 300); // 5-minute sync cooldown

                        return {
                            siteId,
                            totalViews: newStats.totalViews,
                            todayViews: newStats.todayViews,
                            lastUpdated: newStats.lastUpdated
                        };
                    }

                    // Cek rollover tanggal
                    const lastDate = new Date(stats.lastUpdated);
                    const isSameDay = lastDate.getDate() === today.getDate() &&
                        lastDate.getMonth() === today.getMonth() &&
                        lastDate.getFullYear() === today.getFullYear();

                    const initialTotal = stats.totalViews + 1;
                    const initialToday = (isSameDay ? stats.todayViews : 0) + 1;

                    // Update PostgreSQL untuk inisialisasi sync awal
                    const updatedDbStats = await tenantRepo.updateSiteStatistics(stats.id, {
                        totalViews: initialTotal,
                        todayViews: initialToday,
                        lastUpdated: today
                    });

                    // Populate Redis
                    await redis.set(totalKey, initialTotal.toString());
                    await redis.set(todayKey, initialToday.toString());
                    await redis.set(lastKey, today.toISOString());
                    await redis.set(syncKey, "1", "EX", 300);

                    return {
                        siteId,
                        totalViews: updatedDbStats.totalViews,
                        todayViews: updatedDbStats.todayViews,
                        lastUpdated: updatedDbStats.lastUpdated
                    };
                } else {
                    // Cache hit: Increment langsung di Redis (<1ms)
                    const newTotal = await redis.incr(totalKey);
                    const lastUpdatedStr = await redis.get(lastKey);
                    const today = new Date();
                    let isSameDay = false;

                    if (lastUpdatedStr) {
                        const lastDate = new Date(lastUpdatedStr);
                        isSameDay = lastDate.getDate() === today.getDate() &&
                            lastDate.getMonth() === today.getMonth() &&
                            lastDate.getFullYear() === today.getFullYear();
                    }

                    let newToday = 1;
                    if (isSameDay) {
                        newToday = await redis.incr(todayKey);
                    } else {
                        await redis.set(todayKey, "1");
                        await redis.set(lastKey, today.toISOString());
                    }

                    const updatedStats: AnalyticsStats = {
                        siteId,
                        totalViews: newTotal,
                        todayViews: newToday,
                        lastUpdated: today
                    };

                    // Cek apakah sinkronisasi DB diperlukan (throttle 5 menit)
                    const isSynced = await redis.get(syncKey);
                    if (!isSynced) {
                        await redis.set(syncKey, "1", "EX", 300);

                        // Jalankan sinkronisasi asinkron fire-and-forget
                        (async () => {
                            try {
                                const finalTotalStr = await redis.get(totalKey);
                                const finalTodayStr = await redis.get(todayKey);
                                if (finalTotalStr && finalTodayStr) {
                                    await tenantRepo.upsertSiteStatistics(siteId, {
                                        totalViews: parseInt(finalTotalStr),
                                        todayViews: parseInt(finalTodayStr),
                                        lastUpdated: new Date()
                                    });
                                }
                            } catch (syncErr) {
                                console.warn("[Analytics DB Sync Error]:", syncErr);
                            }
                        })();
                    }

                    return updatedStats;
                }
            }
        } catch (redisError) {
            console.warn("[Redis Analytics Warning]: falling back to database", redisError);
        }
    }

    // --- Database Fallback (jika Redis tidak tersedia / error) ---
    const stats = await tenantRepo.findSiteStatistics(siteId);
    const today = new Date();

    if (!stats) {
        const newStats = await tenantRepo.createSiteStatistics({
            siteId,
            totalViews: 1,
            todayViews: 1,
            lastUpdated: today
        });
        return {
            siteId,
            totalViews: newStats.totalViews,
            todayViews: newStats.todayViews,
            lastUpdated: newStats.lastUpdated
        };
    }

    const lastDate = new Date(stats.lastUpdated);
    const isSameDay = lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear();

    let updatedStats;

    if (isSameDay) {
        updatedStats = await tenantRepo.updateSiteStatistics(stats.id, {
            totalViews: stats.totalViews + 1,
            todayViews: stats.todayViews + 1,
            lastUpdated: today
        });
    } else {
        updatedStats = await tenantRepo.updateSiteStatistics(stats.id, {
            totalViews: stats.totalViews + 1,
            todayViews: 1,
            lastUpdated: today
        });
    }

    return {
        siteId,
        totalViews: updatedStats.totalViews,
        todayViews: updatedStats.todayViews,
        lastUpdated: updatedStats.lastUpdated
    };
}
