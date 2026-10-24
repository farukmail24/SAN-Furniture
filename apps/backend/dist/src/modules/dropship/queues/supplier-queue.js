import { Queue } from "bullmq";
import dotenv from "dotenv";
dotenv.config();
export const SUPPLIER_SYNC_QUEUE_NAME = "supplier-feed-sync";
export const ORDER_FULFILLMENT_QUEUE_NAME = "order-fulfillment-dispatch";
export function getRedisConnectionOptions() {
    const redisUrl = process.env.REDIS_URL || "redis://:redis_local_secure@localhost:6379";
    const parsed = new URL(redisUrl);
    return {
        host: parsed.hostname || "localhost",
        port: parseInt(parsed.port || "6379", 10),
        password: parsed.password || undefined,
        maxRetriesPerRequest: null,
    };
}
export function createSupplierSyncQueue(connection) {
    return new Queue(SUPPLIER_SYNC_QUEUE_NAME, {
        connection: connection || getRedisConnectionOptions(),
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
            removeOnComplete: {
                age: 86400, // 24 hours
                count: 1000,
            },
            removeOnFail: {
                age: 604800, // 7 days
            },
        },
    });
}
export function createOrderFulfillmentQueue(connection) {
    return new Queue(ORDER_FULFILLMENT_QUEUE_NAME, {
        connection: connection || getRedisConnectionOptions(),
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: "exponential",
                delay: 3000,
            },
            removeOnComplete: true,
        },
    });
}
