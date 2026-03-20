/**
 * Tauri IPC Mock Server
 *
 * Provides stub endpoints mirroring Tauri's IPC bridge so the web app
 * can run in Docker without a real Tauri/Rust backend.
 *
 * Endpoints:
 *   POST /tauri/invoke  → mock Tauri command handler
 *   GET  /health        → { status: "ok" }
 */

import http from 'node:http'

const PORT = Number(process.env.TAURI_MOCK_PORT) || 3002

/** Stub responses for Tauri commands */
const COMMAND_STUBS = {
    get_version: { version: '0.1.0-mock' },
    get_platform: { platform: 'docker-mock', arch: 'x86_64' },
    read_file: { content: '', error: null },
    write_file: { success: true },
    open_dialog: { path: null, cancelled: true },
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
    }

    if (req.url === '/health' || req.url === '/health/') {
        res.writeHead(200)
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
        return
    }

    if (req.url === '/tauri/invoke' && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => {
            if (body.length > 1024 * 64) return // 64 KB limit
            body += chunk
        })
        req.on('end', () => {
            try {
                const { cmd } = JSON.parse(body)
                const stub = COMMAND_STUBS[cmd] ?? { error: `Unknown command: ${cmd}` }
                res.writeHead(200)
                res.end(JSON.stringify(stub))
            } catch {
                res.writeHead(400)
                res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
        })
        return
    }

    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🖥  Tauri Mock IPC running on http://0.0.0.0:${PORT}`)
    console.log(`   POST /tauri/invoke  → mock Tauri commands`)
    console.log(`   GET  /health        → service health check`)
})
