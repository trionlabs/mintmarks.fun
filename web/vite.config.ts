import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      wasm(),
      topLevelAwait(),
      nodePolyfills({
        include: [
          'buffer',
          'crypto',
          'stream',
          'util',
          'path',
          'dns',
          'net',
          'tls',
          'http',
          'https',
          'url',
          'zlib',
          'timers',
          'vm',
          'events',
          'string_decoder',
        ],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // WASM module aliases for Noir
        '@noir-lang/acvm_js/web': '@noir-lang/acvm_js/web/acvm_js.js',
        '@noir-lang/noirc_abi/web': '@noir-lang/noirc_abi/web/noirc_abi_wasm.js',
        // Pino shim for browser (zk-email dependency)
        pino: path.resolve(__dirname, 'src/lib/pino-shim.ts'),
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
    assetsInclude: ['**/*.wasm', '**/*.wasm.gz'],
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      // Allow serving files from node_modules (including pnpm workspace root)
      // Required for @aztec/bb.js dynamic imports across multiple versions
      fs: {
        allow: ['.', 'node_modules', '../node_modules'],
      },
      proxy: {
        '/api/rpc': {
          target: env.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/rpc/, ''),
        },
      },
    },
  }
})

