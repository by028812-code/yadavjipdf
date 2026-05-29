'use client'

import { useState } from 'react'
import { Upload, X, FileText, Loader2, Download, CheckCircle, Info } from 'lucide-react'

export function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ downloadUrl: string; fileName: string; message: string; totalPages?: number; extractedPages?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleSplit = async () => {
    if (!file) {
      setError('Please upload a PDF file')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pages', pages)
      const res = await fetch('/api/pdf/split', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Split failed')
      setResult(data)
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Processing failed – Please recheck your file.')
      console.error(`[SplitPdfTool] ${e.stack || e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Upload area */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-8 text-center transition-colors"
        >
          <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">Drag & drop a PDF file here</p>
          <p className="text-sm text-gray-400 mb-3">or click to browse</p>
          <label className="inline-block cursor-pointer">
            <span className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Select PDF File
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
          <FileText className="w-8 h-8 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
          </div>
          <button
            onClick={() => { setFile(null); setResult(null) }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Page range input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Page Range</label>
        <input
          type="text"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          placeholder="e.g., 1-3, 5, 7-9 (leave empty for all pages)"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Enter page numbers or ranges separated by commas. Example: &quot;1-3, 5, 7-9&quot; extracts pages 1, 2, 3, 5, 7, 8, 9.
            Leave empty to extract all pages.
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{result.message}</p>
            {result.totalPages && (
              <p className="text-xs text-green-600 mt-0.5">
                Total pages: {result.totalPages} | Extracted: {result.extractedPages}
              </p>
            )}
          </div>
          <a
            href={result.downloadUrl}
            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      )}

      {/* Split button */}
      <button
        onClick={handleSplit}
        disabled={processing || !file}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Splitting PDF...
          </>
        ) : (
          'Split PDF'
        )}
      </button>
    </div>
  )
}
