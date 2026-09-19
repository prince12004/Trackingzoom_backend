"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const app_1 = require("./app");
const cron_1 = require("./jobs/cron");
require("./models");
async function main() {
    await (0, db_1.connectDB)();
    const app = (0, app_1.createApp)();
    const server = app.listen(env_1.env.port, () => {
        console.log(`[server] TrackingZoom GPS API listening on port ${env_1.env.port} (${env_1.env.nodeEnv})`);
    });
    (0, cron_1.startCronJobs)();
    process.on('unhandledRejection', (reason) => {
        console.error('[fatal] Unhandled rejection:', reason);
    });
    process.on('SIGTERM', () => {
        console.log('[server] SIGTERM received, shutting down gracefully');
        server.close(() => process.exit(0));
    });
}
main().catch((err) => {
    console.error('[fatal] Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map