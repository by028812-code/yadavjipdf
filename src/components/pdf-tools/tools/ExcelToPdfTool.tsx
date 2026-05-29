'use client'

import { useState } from 'react'
import { Upload, X, Table, Loader2, Download, CheckCircle, AlertTriangle } from 'lucide-react'
import { downloadFromApi, triggerDownload } from '@/lib/download-utils'
import { MAX_FILE_SIZE, formatFileSize, checkFileSize } from '@/lib/file-utils'

export function ExcelToPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File) => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      setError('Please select an Excel or CSV file (.xlsx, .xls, .csv)')
      return
    }
    const sizeErr = checkFileSize(f)
    if (sizeErr) {
      setError(sizeErr)
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleConvert = async () => {
    if (!file) {
      setError('Please upload a spreadsheet file')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await downloadFromApi('/api/pdf/excel-to-pdf', formData)
      setResult({ message: res.message })
      triggerDownload(res.blob, res.fileName)
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Processing failed – Please recheck your file.')
      console.error(`[ExcelToPdfTool] ${e.stack || e.message}`)
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
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-8 text-center transition-colors"
        >
          <Table className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">Drag & drop a spreadsheet here</p>
          <p className="text-sm text-gray-400 mb-3">.xlsx, .xls, and .csv files supported (max {formatFileSize(MAX_FILE_SIZE)})</p>
          <label className="inline-block cursor-pointer">
            <span className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Select Excel/CSV File
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
          <Table className="w-8 h-8 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
          </div>
          <button
            onClick={() => { setFile(null); setResult(null) }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
        <strong>Made in India</strong> — Your spreadsheet is converted to PDF securely on our servers. Your files are never stored.
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
          </div>
          <p className="text-xs text-green-600">Downloaded!</p>
        </div>
      )}

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={processing || !file}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Converting to PDF...
          </>
        ) : (
          'Convert Excel to PDF'
        )}
      </button>
    </div>
  )
}
