import cron from 'node-cron';
import { captureAbandonedCarts, sendAbandonedCartReminders } from '../services/abandonedCart.service';

export function startCronJobs(): void {
  // Every 15 minutes: snapshot carts that have gone stale for 60+ minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const count = await captureAbandonedCarts();
      if (count > 0) console.log(`[cron] captured ${count} abandoned cart(s)`);
    } catch (err) {
      console.error('[cron] captureAbandonedCarts failed', err);
    }
  });

  // Every 30 minutes: send abandoned cart recovery reminders (SMS at 1h, email at 24h)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const count = await sendAbandonedCartReminders();
      if (count > 0) console.log(`[cron] sent ${count} abandoned cart reminder(s)`);
    } catch (err) {
      console.error('[cron] sendAbandonedCartReminders failed', err);
    }
  });

  console.log('[cron] background jobs scheduled');
}
