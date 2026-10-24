import { Queue, type ConnectionOptions } from "bullmq";
export declare const SUPPLIER_SYNC_QUEUE_NAME = "supplier-feed-sync";
export declare const ORDER_FULFILLMENT_QUEUE_NAME = "order-fulfillment-dispatch";
export declare function getRedisConnectionOptions(): ConnectionOptions;
export declare function createSupplierSyncQueue(connection?: ConnectionOptions): Queue;
export declare function createOrderFulfillmentQueue(connection?: ConnectionOptions): Queue;
