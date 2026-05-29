/**
 * File size limit constant (4 MB) — Vercel serverless has a ~4.5 MB body limit.
 * We use 4 MB to leave some headroom for multipart form data overhead.
 */
export const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function checkFileSize(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" is ${formatFileSize(file.size)} — max allowed is ${formatFileSize(MAX_FILE_SIZE)}. Please use a smaller file.`
  }
  return null
}
