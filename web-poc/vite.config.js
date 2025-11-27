import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load env from root directory
  const env = loadEnv(mode, '..', '')

  return {
    plugins: [
      react(),
      wasm(),
      topLevelAwait(),
      nodePolyfills({
        include: ['crypto', 'buffer', 'stream', 'util', 'path', 'fs', 'dns', 'net', 'tls', 'http', 'https', 'url', 'zlib', 'timers', 'vm', 'events', 'string_decoder'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        overrides: {
          timers: 'timers-browserify',
          vm: 'vm-browserify',
        },
      }),
    ],
    // Read .env from root directory
    envDir: '..',
    resolve: {
      alias: {
        '@noir-lang/acvm_js/web': '@noir-lang/acvm_js/web/acvm_js.js',
        '@noir-lang/noirc_abi/web': '@noir-lang/noirc_abi/web/noirc_abi_wasm.js',
        'pino': path.resolve(__dirname, 'src/lib/pino-shim.js'),
      },
    },
    optimizeDeps: {
      exclude: [
        '@aztec/bb.js',
        '@noir-lang/noir_js',
        '@noir-lang/acvm_js',
        '@noir-lang/noirc_abi',
      ],
      esbuildOptions: {
        target: 'esnext',
      },
    },
    build: {
      target: 'esnext',
    },
    worker: {
      format: 'es',
      plugins: () => [wasm(), topLevelAwait()],
    },
    // Ensure proper WASM file handling
    assetsInclude: ['**/*.wasm', '**/*.wasm.gz'],
    server: {
      headers: {
        // Ensure WASM files are served with correct MIME type
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      fs: {
        // Allow serving files from node_modules
        allow: ['..'],
      },
      proxy: {
        // Proxy RPC requests to bypass CORS in dev
        '/api/rpc': {
          target: env.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/rpc/, ''),
        },
      },
    },
  }
})
