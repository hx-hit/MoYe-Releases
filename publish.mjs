import { readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const metadata = JSON.parse(await readFile('release.json', 'utf8'))
if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) throw new Error('Invalid release version')
const expected = [
  `Moye-Setup-${metadata.version}-x64.exe`,
  `Moye-Setup-${metadata.version}-x64.exe.blockmap`,
  `Moye-Portable-${metadata.version}-x64.exe`,
  'SHA256SUMS.txt',
  'latest.yml',
]
if (
  JSON.stringify(metadata.assets.map((a) => a.name).sort()) !== JSON.stringify([...expected].sort())
)
  throw new Error('Invalid release assets')
for (const asset of metadata.assets) {
  const data = await readFile(`packages/${asset.name}`)
  if (
    data.length !== asset.size ||
    createHash('sha256').update(data).digest('hex') !== asset.sha256
  )
    throw new Error('Asset verification failed')
}
const manifest = await readFile('packages/latest.yml', 'utf8')
if (
  !manifest.startsWith(`version: ${metadata.version}\n`) &&
  !manifest.startsWith(`version: ${metadata.version}\r\n`)
)
  throw new Error('Manifest version mismatch')
const base = 'https://api.github.com/repos/hx-hit/MoYe-Releases'
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'MoYe-public-publisher',
}
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } })
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`)
  return response.status === 204 ? null : response.json()
}
const releases = await api(`${base}/releases?per_page=100`)
let release = releases.find((r) => r.tag_name === `v${metadata.version}`)
if (release && !release.draft) {
  console.log(`Already published ${release.html_url}`)
  process.exit(0)
}
const json = (body) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
if (!release)
  release = await api(`${base}/releases`, {
    method: 'POST',
    ...json({
      tag_name: `v${metadata.version}`,
      target_commitish: process.env.GITHUB_SHA || 'main',
      name: `墨页 MoYe v${metadata.version}`,
      body: metadata.body,
      draft: true,
    }),
  })
for (const name of expected) {
  const existing = release.assets.find((a) => a.name === name)
  if (existing) await api(`${base}/releases/assets/${existing.id}`, { method: 'DELETE' })
  await api(release.upload_url.replace(/\{.*$/, '') + `?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String((await stat(`packages/${name}`)).size),
    },
    body: await readFile(`packages/${name}`),
  })
}
await api(`${base}/releases/${release.id}`, {
  method: 'PATCH',
  ...json({ draft: false, make_latest: 'true' }),
})
console.log(`Published ${release.html_url}`)
