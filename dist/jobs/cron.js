"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const abandonedCart_service_1 = require("../services/abandonedCart.service");
function startCronJobs() {
    // Every 15 minutes: snapshot carts that have gone stale for 60+ minutes
    node_cron_1.default.schedule('*/15 * * * *', async () => {
        try {
            const count = await (0, abandonedCart_service_1.captureAbandonedCarts)();
            if (count > 0)
                console.log(`[cron] captured ${count} abandoned cart(s)`);
        }
        catch (err) {
            console.error('[cron] captureAbandonedCarts failed', err);
        }
    });
    // Every 30 minutes: send abandoned cart recovery reminders (SMS at 1h, email at 24h)
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        try {
            const count = await (0, abandonedCart_service_1.sendAbandonedCartReminders)();
            if (count > 0)
                console.log(`[cron] sent ${count} abandoned cart reminder(s)`);
        }
        catch (err) {
            console.error('[cron] sendAbandonedCartReminders failed', err);
        }
    });
    console.log('[cron] background jobs scheduled');
}
//# sourceMappingURL=cron.js.map