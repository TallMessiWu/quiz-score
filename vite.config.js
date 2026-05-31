import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const DATA_FILE = resolve('./data.json')
const DEFAULT = { seasonStartDate: null, groups: [], bank: [], history: [], players: [], scoreHistory: [] }

const REPORT_CONFIG_FILE = resolve('./report-config.json')
const DEFAULT_REPORT_CONFIG = { companyName: '', departmentName: '', seasonName: '', archiveUrl: '', logo: '', themeColor: '' }

function readData() {
  try {
    if (!existsSync(DATA_FILE)) {
      writeFileSync(DATA_FILE, JSON.stringify(DEFAULT, null, 2), 'utf-8')
      return { ...DEFAULT }
    }
    return { ...DEFAULT, ...JSON.parse(readFileSync(DATA_FILE, 'utf-8')) }
  } catch {
    return { ...DEFAULT }
  }
}

function patchData(patch) {
  writeFileSync(DATA_FILE, JSON.stringify({ ...readData(), ...patch }, null, 2), 'utf-8')
}

function readReportConfig() {
  try {
    if (!existsSync(REPORT_CONFIG_FILE)) {
      writeFileSync(REPORT_CONFIG_FILE, JSON.stringify(DEFAULT_REPORT_CONFIG, null, 2), 'utf-8')
      return { ...DEFAULT_REPORT_CONFIG }
    }
    return { ...DEFAULT_REPORT_CONFIG, ...JSON.parse(readFileSync(REPORT_CONFIG_FILE, 'utf-8')) }
  } catch {
    return { ...DEFAULT_REPORT_CONFIG }
  }
}

function patchReportConfig(patch) {
  writeFileSync(REPORT_CONFIG_FILE, JSON.stringify({ ...readReportConfig(), ...patch }, null, 2), 'utf-8')
}

async function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', c => (raw += c))
    req.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve({}) } })
  })
}

function apiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET' && req.url === '/api/data') {
          return res.end(JSON.stringify(readData()))
        }
        if (req.method === 'PUT' && req.url === '/api/groups') {
          patchData({ groups: await readBody(req) })
          return res.end('{"ok":true}')
        }
        if (req.method === 'PUT' && req.url === '/api/questions') {
          const b = await readBody(req)
          patchData({ bank: b.bank, history: b.history })
          return res.end('{"ok":true}')
        }
        if (req.method === 'PUT' && req.url === '/api/leaderboard') {
          const b = await readBody(req)
          patchData({ players: b.players, scoreHistory: b.scoreHistory })
          return res.end('{"ok":true}')
        }
        if (req.method === 'PUT' && req.url === '/api/season') {
          const b = await readBody(req)
          patchData({ seasonStartDate: b.seasonStartDate ?? null })
          return res.end('{"ok":true}')
        }
        if (req.method === 'GET' && req.url === '/api/report-config') {
          return res.end(JSON.stringify(readReportConfig()))
        }
        if (req.method === 'PUT' && req.url === '/api/report-config') {
          patchReportConfig(await readBody(req))
          return res.end('{"ok":true}')
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), apiPlugin()],
  server: { port: 6970 },
})
