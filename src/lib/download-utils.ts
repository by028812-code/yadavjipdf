/**
 * Download helper for API routes that return binary files.
 * The API returns the file directly with metadata in X- headers.
 */

export interface DownloadResult {
  message: string
  fileName: string
  blob: Blob
  // Optional metadata from compress tool
  originalSize?: number
  compressedSize?: number
  savingsPercent?: string
  totalPages?: number
  extractedPages?: number
}

export async function downloadFromApi(
  url: string,
  formData: FormData
): Promise<DownloadResult> {
  const res = await fetch(url, { method: 'POST', body: formData })

  if (!res.ok) {
    // Try to parse error as JSON
    try {
      const data = await res.json()
      throw new Error(data.error || 'Processing failed')
    } catch (e) {
      if (e instanceof Error && e.message !== 'Processing failed') throw e
      throw new Error(`Processing failed (HTTP ${res.status})`)
    }
  }

  const blob = await res.blob()

  // Extract metadata from headers
  const message = res.headers.get('X-Message') || 'File processed successfully'
  const contentDisposition = res.headers.get('Content-Disposition') || ''
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
  const fileName = fileNameMatch ? fileNameMatch[1] : 'download'

  const originalSize = res.headers.get('X-Original-Size')
  const compressedSize = res.headers.get('X-Compressed-Size')
  const savingsPercent = res.headers.get('X-Savings-Percent')
  const totalPages = res.headers.get('X-Total-Pages')
  const extractedPages = res.headers.get('X-Extracted-Pages')

  return {
    message,
    fileName,
    blob,
    originalSize: originalSize ? Number(originalSize) : undefined,
    compressedSize: compressedSize ? Number(compressedSize) : undefined,
    savingsPercent: savingsPercent || undefined,
    totalPages: totalPages ? Number(totalPages) : undefined,
    extractedPages: extractedPages ? Number(extractedPages) : undefined,
  }
}

export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
