import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const applicationRequestZipUrl = 'https://www.nordea.fi/Images/146-88693/ApplicationRequest.zip'
const applicationResponseZipUrl = 'https://www.nordea.fi/Images/146-88696/ApplicationResponse.zip'

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.arrayBuffer()
}

async function unzipSingleXml(zipBytes: Uint8Array): Promise<string> {
  // Minimal ZIP reader: these Nordea zips are small and contain a single XML file.
  // We intentionally avoid adding extra dependencies here.
  //
  // Format: local file header signature 0x04034b50.
  // We scan for it and extract the first entry.

  const sig = 0x04034b50
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength)
  for (let offset = 0; offset + 30 < zipBytes.length; offset++) {
    if (view.getUint32(offset, true) !== sig) continue

    const compressionMethod = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const uncompressedSize = view.getUint32(offset + 22, true)
    const fileNameLength = view.getUint16(offset + 26, true)
    const extraFieldLength = view.getUint16(offset + 28, true)

    const fileNameStart = offset + 30
    const fileNameEnd = fileNameStart + fileNameLength
    const fileName = new TextDecoder('utf-8').decode(zipBytes.slice(fileNameStart, fileNameEnd))

    const dataStart = fileNameEnd + extraFieldLength
    const dataEnd = dataStart + compressedSize

    if (!fileName.toLowerCase().endsWith('.xml')) {
      // continue scanning for an XML entry
      offset = dataEnd
      continue
    }

    const compressed = zipBytes.slice(dataStart, dataEnd)

    if (compressionMethod === 0) {
      // stored
      return new TextDecoder('utf-8').decode(compressed)
    }

    if (compressionMethod === 8) {
      // deflate
      const { inflateRawSync } = await import('node:zlib')
      const inflated = inflateRawSync(compressed)
      if (uncompressedSize && inflated.length !== uncompressedSize) {
        // best-effort; do not fail on mismatch
      }
      return inflated.toString('utf8')
    }

    throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`)
  }

  throw new Error('No XML file found in ZIP')
}

async function main() {
  const outDir = join(process.cwd(), 'resources', 'banking', 'nordea', 'schema', 'secure-envelope')
  await mkdir(outDir, { recursive: true })

  const reqZip = new Uint8Array(await fetchArrayBuffer(applicationRequestZipUrl))
  const resZip = new Uint8Array(await fetchArrayBuffer(applicationResponseZipUrl))

  const applicationRequestXsd = await unzipSingleXml(reqZip)
  const applicationResponseXsd = await unzipSingleXml(resZip)

  await writeFile(join(outDir, 'ApplicationRequest.xsd'), applicationRequestXsd, 'utf8')
  await writeFile(join(outDir, 'ApplicationResponse.xsd'), applicationResponseXsd, 'utf8')

  // eslint-disable-next-line no-console
  console.log(`Wrote schemas to ${outDir}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
