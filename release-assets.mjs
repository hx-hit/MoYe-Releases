import { createHash } from 'node:crypto'

export function releaseNames(version, schemaVersion = 2) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid release version')
  const names = [
    `Moye-Setup-${version}-x64.exe`,
    `Moye-Setup-${version}-x64.exe.blockmap`,
    `Moye-Portable-${version}-x64.exe`,
  ]
  if (schemaVersion === 2) {
    for (const arch of ['x64', 'arm64']) {
      names.push(
        `Moye-${version}-linux-${arch}.deb`,
        `Moye-${version}-linux-${arch}.tar.gz`,
        `Moye-${version}-macos-${arch}.dmg`,
      )
    }
  } else if (schemaVersion !== 1) throw new Error('Unknown release schema')
  return [...names, 'SHA256SUMS.txt', 'latest.yml']
}

export function validateMetadata(metadata) {
  const expected = releaseNames(metadata.version, metadata.schemaVersion || 1)
  if (
    !Array.isArray(metadata.assets) ||
    JSON.stringify(metadata.assets.map((a) => a.name).sort()) !==
      JSON.stringify([...expected].sort())
  )
    throw new Error('Incomplete or invalid platform assets')
  for (const asset of metadata.assets) {
    if (
      !Number.isSafeInteger(asset.size) ||
      asset.size <= 0 ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)
    )
      throw new Error('Invalid asset checksum or size')
  }
  return expected
}

export function verifyWindowsManifest(manifest, version, installer) {
  const name = `Moye-Setup-${version}-x64.exe`
  if (!new RegExp(`^version: ${version.replaceAll('.', '\\.')}\\r?\\n`).test(manifest))
    throw new Error('Manifest version mismatch')
  const url = manifest.match(/^\s+- url: (.+)\r?$/m)?.[1]?.trim()
  const sha512 = manifest.match(/^\s+sha512: (\S+)/m)?.[1]
  const size = Number(manifest.match(/^\s+size: (\d+)/m)?.[1])
  if (
    url !== name ||
    size !== installer.length ||
    createHash('sha512').update(installer).digest('base64') !== sha512
  )
    throw new Error('Windows manifest does not match installer')
}
