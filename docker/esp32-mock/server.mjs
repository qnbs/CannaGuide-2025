/**
 * ESP32 Environmental Sensor Simulator
 *
 * Generates realistic temperature + humidity readings that follow
 * a diurnal (day/night) cycle with configurable noise.
 *
 * Serves data via a simple HTTP API for local development testing
 * when real ESP32 hardware is unavailable.
 *
 * Usage: node docker/esp32-mock/server.mjs
 * Endpoints:
 *   GET /sensor  → { temperature, humidity, timestamp }
 *   GET /health  → { status: "ok" }
 */

import http from 'node:http'

const PORT = Number(process.env.ESP32_MOCK_PORT) || 3001
const UPDATE_INTERVAL_MS = 2000

// Grow room baseline parameters
const BASE_TEMP = 25.0       // °C day baseline
const NIGHT_TEMP = 20.0      // °C night baseline
const BASE_HUMIDITY = 55.0   // % RH day baseline
const NIGHT_HUMIDITY = 65.0  // % RH night baseline
const TEMP_NOISE = 0.8       // ±°C random variation
const HUMIDITY_NOISE = 2.0   // ±% RH random variation

// Simple diurnal cycle: 18h light / 6h dark (typical flowering)
const LIGHT_HOURS = 18
const DARK_START_HOUR = 22   // Lights off at 22:00

let currentReading = generateReading()

function isDayPhase() {
  const hour = new Date().getHours()
  if (hour >= DARK_START_HOUR || hour < (DARK_START_HOUR + (24 - LIGHT_HOURS)) % 24) {
    return false
  }
  return true
}

function generateReading() {
  const isDay = isDayPhase()
  const baseTemp = isDay ? BASE_TEMP : NIGHT_TEMP
  const baseHum = isDay ? BASE_HUMIDITY : NIGHT_HUMIDITY

  const temperature = Math.round((baseTemp + (Math.random() - 0.5) * 2 * TEMP_NOISE) * 100) / 100
  const humidity = Math.round((baseHum + (Math.random() - 0.5) * 2 * HUMIDITY_NOISE) * 100) / 100

  return {
    temperature: Math.max(15, Math.min(35, temperature)),
    humidity: Math.max(30, Math.min(85, humidity)),
    timestamp: new Date().toISOString(),
    phase: isDay ? 'day' : 'night',
    device: 'ESP32-Mock',
  }
}

// Update readings periodically
setInterval(() => {
  currentReading = generateReading()
}, UPDATE_INTERVAL_MS)

const server = http.createServer((req, res) => {
  // CORS headers for browser access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/sensor' || req.url === '/sensor/') {
    res.writeHead(200)
    res.end(JSON.stringify(currentReading))
    return
  }

  if (req.url === '/health' || req.url === '/health/') {
    res.writeHead(200)
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌡  ESP32 Mock Sensor running on http://0.0.0.0:${PORT}`)
  console.log(`   GET /sensor  → current temperature & humidity`)
  console.log(`   GET /health  → service health check`)
})
