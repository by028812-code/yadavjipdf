'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileText, ArrowUpDown, Loader2, Download, CheckCircle, AlertTriangle } from 'lucide-react'
import { downloadFromApi, triggerDownload } from '@/lib/download-utils'
import { MAX_FILE_SIZE, formatFileSize, checkFileSize } from '@/lib/file-utils'

export function MergePdfTool() {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ message: string; fileName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    )
    if (pdfFiles.length === 0) {
      setError('Please select PDF files only')
      return
    }
    // Check file sizes
    for (const f of pdfFiles) {
      const sizeErr = checkFileSize(f)
      if (sizeErr) {
        setError(sizeErr)
        return
      }
    }
    setError(null)
    setResult(null)
    setFiles((prev) => [...prev, ...pdfFiles])
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const newArr = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev
      ;[newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]]
      return newArr
    })
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      const result = await downloadFromApi('/api/pdf/merge', formData)
      setResult({ message: result.message, fileName: result.fileName })
      triggerDownload(result.blob, result.fileName)
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Processing failed – Please recheck your file.')
      console.error(`[MergePdfTool] ${e.stack || e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Size limit warning */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Max file size: <strong>{formatFileSize(MAX_FILE_SIZE)}</strong> per file. Larger files will fail to process.</span>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium mb-1">Drag & drop PDF files here</p>
        <p className="text-sm text-gray-400 mb-3">or click to browse (max {formatFileSize(MAX_FILE_SIZE)} each)</p>
        <label className="inline-block cursor-pointer">
          <span className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Select PDF Files
          </span>
          <input
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Files to merge ({files.length})</h3>
          <p className="text-xs text-gray-400">Drag or use arrows to reorder — files merge in the order shown</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <FileText className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveFile(i, 'up')}
                    disabled={i === 0}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => moveFile(i, 'down')}
                    disabled={i === files.length - 1}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFile(i)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          </div>
        </div>
      )}

      {/* Merge button */}
      <button
        onClick={handleMerge}
        disabled={processing || files.length < 2}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Merging PDFs...
          </>
        ) : (
          `Merge ${files.length} PDF${files.length !== 1 ? 's' : ''}`
        )}
      </button>
    </div>
  )
}
