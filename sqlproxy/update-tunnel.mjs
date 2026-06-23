import { spawn } from 'child_process'

import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Read Vercel token from CLI auth file (set by `vercel login`)
let VERCEL_TOKEN = process.env.VERCEL_TOKEN
if (!VERCEL_TOKEN) {
  try {
    const authFile = join(homedir(), 'AppData', 'Roaming', 'xdg.data', 'com.vercel.cli', 'auth.json')
    const auth = JSON.parse(readFileSync(authFile, 'utf8'))
    VERCEL_TOKEN = auth.token
  } catch { /* ignore */ }
}
const PROJECT_ID = 'prj_qjzEOGoqa1X1xgZiLWEPlN7vEacz'
const CF_PATH = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe'

console.log('Starting Cloudflare quick tunnel...')

const cf = spawn(CF_PATH, ['tunnel', '--url', 'http://localhost:3099'], {
  stdio: ['ignore', 'pipe', 'pipe']
})

let urlFound = false

const handleOutput = async (data) => {
  const text = data.toString()
  const match = text.match(/https:\/\/[\w-]+\.trycloudflare\.com/)
  if (match && !urlFound) {
    urlFound = true
    const tunnelUrl = match[0]
    console.log('Tunnel URL:', tunnelUrl)

    // Update SQLPROXY_URL in Vercel via API
    try {
      // Delete existing
      await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' }
      }).then(r => r.json()).then(async data => {
        const existing = (data.envs || []).find(e => e.key === 'SQLPROXY_URL')
        if (existing) {
          await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${existing.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
          })
        }
      })

      // Add new
      const res = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'SQLPROXY_URL',
          value: tunnelUrl,
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        })
      })

      if (res.ok) {
        console.log('SQLPROXY_URL updated in Vercel:', tunnelUrl)
        // Trigger redeploy
        await fetch(`https://api.vercel.com/v13/deployments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'crown-xpress-transport', gitSource: { type: 'github', repoId: 'crown-xpress-transport', ref: 'main' } })
        })
        console.log('Redeploy triggered')
      } else {
        console.error('Failed to update Vercel:', await res.text())
      }
    } catch (e) {
      console.error('Vercel update error:', e.message)
    }
  }
}

cf.stdout.on('data', handleOutput)
cf.stderr.on('data', handleOutput)

cf.on('close', (code) => {
  console.log('Cloudflare tunnel closed, code:', code)
  process.exit(code)
})

process.on('SIGINT', () => { cf.kill(); process.exit() })
process.on('SIGTERM', () => { cf.kill(); process.exit() })
