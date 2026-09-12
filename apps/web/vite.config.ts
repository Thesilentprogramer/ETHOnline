import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const swarmRoot = path.resolve(rootDir, '../../runtime')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function runtimeStatic(): Plugin {
  const send = (file: string, res: import('http').ServerResponse) => {
    const ext = path.extname(file)
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
    fs.createReadStream(file).pipe(res)
  }
  const resolveFile = (urlPath: string) => {
    const rel = decodeURIComponent(urlPath.replace(/^\/runtime\/?/, '') || 'p2p.html')
    const file = path.resolve(swarmRoot, rel)
    if (!file.startsWith(swarmRoot)) return null
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return null
    return file
  }
  return {
    name: 'trusted-swarm-runtime',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (!url.startsWith('/runtime')) return next()
        const file = resolveFile(url)
        if (!file) return next()
        send(file, res)
      })
    },
    closeBundle() {
      const out = path.resolve(rootDir, 'dist/runtime')
      const skip = new Set(['docs', 'tests', 'roadmap', '.github', 'benchmarks', '.git', 'node_modules'])
      fs.cpSync(swarmRoot, out, {
        recursive: true,
        filter: (src) => {
          const rel = path.relative(swarmRoot, src).split(path.sep)[0]
          return !rel || !skip.has(rel)
        },
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), runtimeStatic()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@runtime': swarmRoot,
    },
  },
  server: {
    host: true,
    port: 5180,
    strictPort: false,
    allowedHosts: true,
    hmr: {
      protocol: 'ws',
      host: process.env.LAN_HOST || '192.168.0.103',
      clientPort: 5180,
    },
    fs: { allow: [rootDir, swarmRoot] },
  },
})
