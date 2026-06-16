import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { apiResponse, apiError } from "@/lib/api/utils";
import { getRedis, isRedisAvailable } from "@/lib/core/redis";

export async function GET() {
    try {
        const siteId = await getSiteId();
        if (!siteId) return apiResponse({ totalViews: 0, todayViews: 0 });

        // Try using Redis Throttle-Write architecture
        if (isRedisAvailable) {
            try {
                const redis = await getRedis();
                if (redis) {
                    const totalKey = `analytics:total_views:${siteId}`;
                    const todayKey = `analytics:today_views:${siteId}`;
                    const lastKey = `analytics:last_updated:${siteId}`;
                    const syncKey = `analytics:sync:${siteId}`;

                    // Check cache availability
                    const totalViewsStr = await redis.get(totalKey);

                    if (totalViewsStr === null) {
                        // Cache miss: Load initial values from PostgreSQL database
                        let stats = await db.siteStatistics.findUnique({
                            where: { siteId }
                        });

                        const today = new Date();

                        if (!stats) {
                            // Create new stats row in database
                            const newStats = await db.siteStatistics.create({
                                data: {
                                    siteId,
                                    totalViews: 1,
                                    todayViews: 1,
                                    lastUpdated: today,
                                }
                            });

                            // Populate Redis
                            await redis.set(totalKey, "1");
                            await redis.set(todayKey, "1");
                            await redis.set(lastKey, today.toISOString());
                            await redis.set(syncKey, "1", "EX", 300); // 5-minute sync cooldown

                            return apiResponse(newStats);
                        }

                        // Check date rollover
                        const lastDate = new Date(stats.lastUpdated);
                        const isSameDay = lastDate.getDate() === today.getDate() &&
                            lastDate.getMonth() === today.getMonth() &&
                            lastDate.getFullYear() === today.getFullYear();

                        // Increment views for the current hit
                        const initialTotal = stats.totalViews + 1;
                        const initialToday = (isSameDay ? stats.todayViews : 0) + 1;

                        // Save the incremented state to DB immediately to keep initial sync
                        const updatedDbStats = await db.siteStatistics.update({
                            where: { id: stats.id },
                            data: {
                                totalViews: initialTotal,
                                todayViews: initialToday,
                                lastUpdated: today
                            }
                        });

                        // Populate Redis
                        await redis.set(totalKey, initialTotal.toString());
                        await redis.set(todayKey, initialToday.toString());
                        await redis.set(lastKey, today.toISOString());
                        await redis.set(syncKey, "1", "EX", 300); // 5-minute sync cooldown

                        return apiResponse(updatedDbStats);
                    } else {
                        // Cache hit: Increment directly in Redis (<1ms)
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

                        const updatedStats = {
                            siteId,
                            totalViews: newTotal,
                            todayViews: newToday,
                            lastUpdated: today
                        };

                        // Check if database sync is required (throttle 5 mins)
                        const isSynced = await redis.get(syncKey);
                        if (!isSynced) {
                            // Lock the sync path for 5 minutes
                            await redis.set(syncKey, "1", "EX", 300);

                            // Trigger asynchronous fire-and-forget sync to Postgres
                            (async () => {
                                try {
                                    const finalTotalStr = await redis.get(totalKey);
                                    const finalTodayStr = await redis.get(todayKey);
                                    if (finalTotalStr && finalTodayStr) {
                                        await db.siteStatistics.upsert({
                                            where: { siteId },
                                            create: {
                                                siteId,
                                                totalViews: parseInt(finalTotalStr),
                                                todayViews: parseInt(finalTodayStr),
                                                lastUpdated: new Date()
                                            },
                                            update: {
                                                totalViews: parseInt(finalTotalStr),
                                                todayViews: parseInt(finalTodayStr),
                                                lastUpdated: new Date()
                                            }
                                        });
                                    }
                                } catch (syncErr) {
                                    console.warn("[Analytics DB Sync Error]:", syncErr);
                                }
                            })();
                        }

                        return apiResponse(updatedStats);
                    }
                }
            } catch (redisError) {
                console.warn("[Redis Analytics Warning]: falling back to database", redisError);
            }
        }

        // --- Database Fallback (Redis unavailable / failed) ---
        const stats = await db.siteStatistics.findUnique({
            where: { siteId }
        });

        if (!stats) {
            const newStats = await db.siteStatistics.create({
                data: {
                    siteId,
                    totalViews: 1,
                    todayViews: 1,
                    lastUpdated: new Date(),
                }
            });
            return apiResponse(newStats);
        }

        const currentStats = stats;
        const lastDate = new Date(currentStats.lastUpdated);
        const today = new Date();
        const isSameDay = lastDate.getDate() === today.getDate() &&
            lastDate.getMonth() === today.getMonth() &&
            lastDate.getFullYear() === today.getFullYear();

        let updatedStats;

        if (isSameDay) {
            updatedStats = await db.siteStatistics.update({
                where: { id: currentStats.id },
                data: {
                    totalViews: { increment: 1 },
                    todayViews: { increment: 1 },
                    lastUpdated: new Date()
                }
            });
        } else {
            updatedStats = await db.siteStatistics.update({
                where: { id: currentStats.id },
                data: {
                    totalViews: { increment: 1 },
                    todayViews: 1,
                    lastUpdated: new Date()
                }
            });
        }

        return apiResponse(updatedStats);

    } catch (error) {
        console.error("Analytics Error:", error);
        return apiError("Internal Error");
    }
}
