'use client'

import { useState } from 'react'
import { Upload, X, FileText, Loader2, Download, CheckCircle } from 'lucide-react'

const qualityOptions = [
  { value: 'screen', label: 'Low (Screen)', desc: '72 DPI — Smallest file size, good for screen viewing' },
  { value: 'ebook', label: 'Medium (Ebook)', desc: '150 DPI — Balanced quality and file size' },
  { value: 'printer', label: 'High (Printer)', desc: '300 DPI — High quality for printing' },
  { value: 'prepress', label: 'Maximum (Prepress)', desc: '300 DPI — Maximum quality, largest file' },
]

export function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState('ebook')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ downloadUrl: string; fileName: string; message: string; originalSize?: number; compressedSize?: number; savingsPercent?: string } | null>(null)
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

  const handleCompress = async () => {
    if (!file) {
      setError('Please upload a PDF file')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('quality', quality)
      const res = await fetch('/api/pdf/compress', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Compression failed')
      setResult(data)
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Processing failed – Please recheck your file.')
      console.error(`[CompressPdfTool] ${e.stack || e.message}`)
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

      {/* Quality selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">Compression Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {qualityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setQuality(opt.value)}
              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                quality === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`text-sm font-medium ${quality === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">{result.message}</p>
          </div>
          {result.originalSize && result.compressedSize && (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-400">Original</p>
                <p className="text-sm font-semibold text-gray-700">{formatSize(result.originalSize)}</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-400">Compressed</p>
                <p className="text-sm font-semibold text-green-700">{formatSize(result.compressedSize)}</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-400">Saved</p>
                <p className="text-sm font-semibold text-blue-700">{result.savingsPercent}</p>
              </div>
            </div>
          )}
          <a
            href={result.downloadUrl}
            className="flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors w-full"
          >
            <Download className="w-4 h-4" />
            Download Compressed PDF
          </a>
        </div>
      )}

      {/* Compress button */}
      <button
        onClick={handleCompress}
        disabled={processing || !file}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Compressing PDF...
          </>
        ) : (
          'Compress PDF'
        )}
      </button>
    </div>
  )
}
