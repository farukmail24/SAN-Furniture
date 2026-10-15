import { createSupplierSyncQueue, SUPPLIER_SYNC_QUEUE_NAME } from "./supplier-queue.js";

export async function scheduleSupplierCronJobs(): Promise<void> {
  const queue = createSupplierSyncQueue();

  // Remove existing repeatable jobs to prevent duplicate intervals
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Add 30-minute recurring stock and price reconciliation
  await queue.add(
    "scheduled-30min-sync",
    {
      triggeredBy: "cron",
      scheduledAt: new Date().toISOString()
    },
    {
      repeat: {
        pattern: "*/30 * * * *" // Every 30 minutes
      },
      jobId: "supplier-feed-sync-cron"
    }
  );

  console.log(`[BullMQ] Scheduled recurring cron job on '${SUPPLIER_SYNC_QUEUE_NAME}' (every 30 mins)`);
  await queue.close();
}
