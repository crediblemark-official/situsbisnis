import { db } from "./db";
import { eventBus } from "./event-bus";

type ProcessPendingEventsOptions = {
    batchSize?: number;
    maxRetries?: number;
};

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 1_000;

let isProcessing = false;

function getRetryDelayMs(retryCount: number) {
    return Math.min(BASE_RETRY_DELAY_MS * 2 ** retryCount, 60_000);
}

export async function processPendingEvents(options: ProcessPendingEventsOptions = {}) {
    if (isProcessing) {
        return { processedCount: 0, failedCount: 0 };
    }

    const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
    const maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;

    isProcessing = true;
    let processedCount = 0;
    let failedCount = 0;

    try {
        const retryableFailedBefore = new Date(Date.now() - getRetryDelayMs(1));

        const outboxEvents = await db.eventOutbox.findMany({
            where: {
                OR: [
                    { status: "pending" },
                    {
                        status: "failed",
                        retryCount: { lt: maxRetries },
                        createdAt: { lte: retryableFailedBefore },
                    },
                ],
            },
            take: batchSize,
            orderBy: { createdAt: "asc" },
        });

        for (const outbox of outboxEvents) {
            const nextRetryCount = outbox.retryCount + 1;

            try {
                await db.eventOutbox.update({
                    where: { id: outbox.id },
                    data: {
                        retryCount: nextRetryCount,
                        error: null,
                    },
                });

                await eventBus.publish(outbox.eventName, outbox.payload, outbox.sourceModule);

                await db.eventOutbox.update({
                    where: { id: outbox.id },
                    data: {
                        status: "published",
                        publishedAt: new Date(),
                        error: null,
                    },
                });

                processedCount++;
            } catch (publishError: any) {
                const shouldRetry = nextRetryCount <= maxRetries;
                const errorMessage = publishError?.message || String(publishError);

                await db.eventOutbox.update({
                    where: { id: outbox.id },
                    data: {
                        status: shouldRetry ? "failed" : "failed",
                        error: errorMessage,
                    },
                });

                failedCount++;
            }
        }
    } catch (queryError) {
        console.error("[Outbox Dispatcher] Database query error:", queryError);
    } finally {
        isProcessing = false;
    }

    return { processedCount, failedCount };
}
