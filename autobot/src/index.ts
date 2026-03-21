import dotenv from 'dotenv';
dotenv.config();

import { startPlatform } from './platform.js';
import { logger } from './shared/logger.js';
import { WEB_PORT } from './config.js';

let shutdown: (() => Promise<void>) | undefined;

async function main() {
  shutdown = await startPlatform(WEB_PORT);
  logger.info('Autobot is running');
}

process.on('SIGINT', () => {
  (shutdown?.() ?? Promise.resolve()).then(() => process.exit(0)).catch(() => process.exit(1));
});
process.on('SIGTERM', () => {
  (shutdown?.() ?? Promise.resolve()).then(() => process.exit(0)).catch(() => process.exit(1));
});

main().catch((err) => {
  logger.error(err, 'Fatal error');
  process.exit(1);
});
