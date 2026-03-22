// dotenv MUST load before any other import that reads process.env
// ESM hoists imports, so we use top-level await with dynamic imports
import dotenv from 'dotenv';
dotenv.config();

// Now safe to import modules that read env vars at module scope
const { startPlatform } = await import('./platform.js');
const { logger } = await import('./shared/logger.js');
const { WEB_PORT } = await import('./config.js');

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
