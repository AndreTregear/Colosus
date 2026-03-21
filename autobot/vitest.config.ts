import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load .env so config.ts doesn't throw for missing DATABASE_URL when running tests.
// The global-setup gracefully handles DB connection failures (warns and skips DB tests).
config();

export default defineConfig({
  test: {
    // Run test files sequentially — they share the same PG database
    fileParallelism: false,
    globalSetup: './tests/global-setup.ts',
    // Remote tests (against yaya.sh) can be slow — increase timeouts
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
