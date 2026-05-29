'use client'

import { useAppStore, ToolType } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  Merge,
  Scissors,
  FileDown,
  Image,
  FileText,
  Table,
  FileOutput,
  Table2,
} from 'lucide-react'

const tools = [
  {
    id: 'merge' as ToolType,
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into a single document. Drag and drop to reorder.',
    icon: Merge,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'split' as ToolType,
    title: 'Split PDF',
    description: 'Extract specific pages or page ranges from a PDF file.',
    icon: Scissors,
    color: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-50',
    borderColor: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'compress' as ToolType,
    title: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality. Choose compression level.',
    icon: FileDown,
    color: 'bg-sky-500',
    hoverColor: 'hover:bg-sky-50',
    borderColor: 'border-sky-200',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'image-to-pdf' as ToolType,
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, WebP images to a professional PDF document.',
    icon: Image,
    color: 'bg-emerald-500',
    hoverColor: 'hover:bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'word-to-pdf' as ToolType,
    title: 'Word to PDF',
    description: 'Convert DOCX and DOC files to PDF format using LibreOffice.',
    icon: FileText,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
  },
  {
    id: 'excel-to-pdf' as ToolType,
    title: 'Excel to PDF',
    description: 'Convert XLSX, XLS, and CSV spreadsheets to PDF format.',
    icon: Table,
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-50',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700',
  },
  {
    id: 'pdf-to-word' as ToolType,
    title: 'PDF to Word',
    description: 'Convert PDF documents to editable DOCX format using pdf2docx.',
    icon: FileOutput,
    color: 'bg-violet-500',
    hoverColor: 'hover:bg-violet-50',
    borderColor: 'border-violet-200',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: 'pdf-to-excel' as ToolType,
    title: 'PDF to Excel',
    description: 'Extract tables from PDF and convert to XLSX using tabula-py.',
    icon: Table2,
    color: 'bg-teal-500',
    hoverColor: 'hover:bg-teal-50',
    borderColor: 'border-teal-200',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
]

export function ToolGrid() {
  const { setActiveTool } = useAppStore()

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          All PDF Tools You Need
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Choose a tool below to get started. All processing happens securely on our servers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {tools.map((tool, i) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveTool(tool.id)}
            className={`group relative p-6 rounded-xl border-2 ${tool.borderColor} ${tool.hoverColor} bg-white text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
          >
            <div className={`w-12 h-12 ${tool.iconBg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{tool.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
