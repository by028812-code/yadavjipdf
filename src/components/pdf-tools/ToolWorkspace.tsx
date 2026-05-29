'use client'

import { ToolType } from '@/lib/store'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MergePdfTool } from '@/components/pdf-tools/tools/MergePdfTool'
import { SplitPdfTool } from '@/components/pdf-tools/tools/SplitPdfTool'
import { CompressPdfTool } from '@/components/pdf-tools/tools/CompressPdfTool'
import { ImageToPdfTool } from '@/components/pdf-tools/tools/ImageToPdfTool'
import { WordToPdfTool } from '@/components/pdf-tools/tools/WordToPdfTool'
import { ExcelToPdfTool } from '@/components/pdf-tools/tools/ExcelToPdfTool'
import { PdfToWordTool } from '@/components/pdf-tools/tools/PdfToWordTool'
import { PdfToExcelTool } from '@/components/pdf-tools/tools/PdfToExcelTool'

const toolInfo: Record<string, { title: string; description: string }> = {
  merge: { title: 'Merge PDF', description: 'Combine multiple PDFs into one document' },
  split: { title: 'Split PDF', description: 'Extract specific pages from a PDF' },
  compress: { title: 'Compress PDF', description: 'Reduce PDF file size' },
  'image-to-pdf': { title: 'Image to PDF', description: 'Convert images to PDF' },
  'word-to-pdf': { title: 'Word to PDF', description: 'Convert DOCX to PDF' },
  'excel-to-pdf': { title: 'Excel to PDF', description: 'Convert spreadsheets to PDF' },
  'pdf-to-word': { title: 'PDF to Word', description: 'Convert PDF to DOCX' },
  'pdf-to-excel': { title: 'PDF to Excel', description: 'Extract tables to XLSX' },
}

const toolComponents: Record<string, React.ComponentType> = {
  merge: MergePdfTool,
  split: SplitPdfTool,
  compress: CompressPdfTool,
  'image-to-pdf': ImageToPdfTool,
  'word-to-pdf': WordToPdfTool,
  'excel-to-pdf': ExcelToPdfTool,
  'pdf-to-word': PdfToWordTool,
  'pdf-to-excel': PdfToExcelTool,
}

export function ToolWorkspace({ tool }: { tool: ToolType }) {
  const { setActiveTool } = useAppStore()
  const info = toolInfo[tool] || { title: 'Tool', description: '' }
  const ToolComponent = toolComponents[tool]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => setActiveTool('home')}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Tools
      </button>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{info.title}</h1>
        <p className="text-gray-500 mt-1">{info.description}</p>
      </div>

      <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 md:p-8 shadow-sm">
        {ToolComponent ? <ToolComponent /> : (
          <p className="text-gray-500">Tool not available</p>
        )}
      </div>
    </div>
  )
}
