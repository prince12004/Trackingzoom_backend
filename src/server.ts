import { env } from './config/env';
import { connectDB } from './config/db';
import { createApp } from './app';
import { startCronJobs } from './jobs/cron';
import './models';

async function main() {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`[server] TrackingZoom GPS API listening on port ${env.port} (${env.nodeEnv})`);
  });

  startCronJobs();

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
