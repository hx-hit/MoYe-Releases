import { readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { validateMetadata, verifyWindowsManifest } from './release-assets.mjs'
const metadata = JSON.parse(await readFile('release.json', 'utf8'))
const expected = validateMetadata(metadata)
for (const asset of metadata.assets) {
  const data = await readFile(`packages/${asset.name}`)
  if (
    data.length !== asset.size ||
    createHash('sha256').update(data).digest('hex') !== asset.sha256
  )
    throw new Error('Asset verification failed')
}
const manifest = await readFile('packages/latest.yml', 'utf8')
verifyWindowsManifest(
  manifest,
  metadata.version,
  await readFile(`packages/Moye-Setup-${metadata.version}-x64.exe`),
)
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
  if (!expected.every((name) => release.assets.some((a) => a.name === name)))
    throw new Error('Published release is incomplete; use a new version')
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
const compare = (a, b) => {
  const x = a.split('.').map(Number),
    y = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}
const newerPublished = releases.some(
  (r) =>
    !r.draft &&
    !r.prerelease &&
    /^v\d+\.\d+\.\d+$/.test(r.tag_name) &&
    compare(r.tag_name.slice(1), metadata.version) > 0,
)
await api(`${base}/releases/${release.id}`, {
  method: 'PATCH',
  ...json({ draft: false, make_latest: newerPublished ? 'false' : 'true' }),
})
console.log(`Published ${release.html_url}`)
