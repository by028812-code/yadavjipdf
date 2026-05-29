'use client'

import { useState, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2, Download, CheckCircle } from 'lucide-react'
import { downloadFromApi, triggerDownload } from '@/lib/download-utils'

export function ImageToPdfTool() {
  const [files, setFiles] = useState<File[]>([])
  const [orientation, setOrientation] = useState('portrait')
  const [pageSize, setPageSize] = useState('a4')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const imageFiles = Array.from(newFiles).filter((f) =>
      f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|tiff?)$/i.test(f.name)
    )
    if (imageFiles.length === 0) {
      setError('Please select image files (JPG, PNG)')
      return
    }
    setError(null)
    setResult(null)

    // Convert non-JPG/PNG images to PNG using Canvas before adding
    const convertedFiles: File[] = []
    for (const f of imageFiles) {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        convertedFiles.push(f)
      } else {
        // Convert to PNG using Canvas
        try {
          const bitmap = await createImageBitmap(f)
          const canvas = document.createElement('canvas')
          canvas.width = bitmap.width
          canvas.height = bitmap.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(bitmap, 0, 0)
          bitmap.close()

          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png')
          })
          const newFile = new File([blob], f.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' })
          convertedFiles.push(newFile)
        } catch {
          // If conversion fails, just add the original file
          convertedFiles.push(f)
        }
      }
    }

    setFiles((prev) => [...prev, ...convertedFiles])
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please add at least one image')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      formData.append('orientation', orientation)
      formData.append('pageSize', pageSize)
      const res = await downloadFromApi('/api/pdf/image-to-pdf', formData)
      setResult({ message: res.message })
      triggerDownload(res.blob, res.fileName)
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Processing failed – Please recheck your file.')
      console.error(`[ImageToPdfTool] ${e.stack || e.message}`)
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
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <ImageIcon className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium mb-1">Drag & drop images here</p>
        <p className="text-sm text-gray-400 mb-3">JPG, PNG, WebP supported</p>
        <label className="inline-block cursor-pointer">
          <span className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Select Images
          </span>
          <input
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Images ({files.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Orientation</label>
          <div className="flex gap-2">
            {['portrait', 'landscape'].map((o) => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                className={`flex-1 py-2 text-sm rounded-lg border-2 capitalize transition-colors ${
                  orientation === o ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Page Size</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
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
          </div>
          <p className="text-xs text-green-600">Downloaded!</p>
        </div>
      )}

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={processing || files.length === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Converting to PDF...
          </>
        ) : (
          `Convert ${files.length} Image${files.length !== 1 ? 's' : ''} to PDF`
        )}
      </button>
    </div>
  )
}
