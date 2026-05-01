import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so pm2 can supervise
  // `.next/standalone/server.js` directly — no `next start` wrapper,
  // no npm in the process tree.
  output: 'standalone',
  async headers() {
    return [
      {
        // ONNX Runtime WASM needs SharedArrayBuffer → requires COOP/COEP headers
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
