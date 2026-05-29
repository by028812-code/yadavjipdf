'use client'

import { useAppStore } from '@/lib/store'
import { FileText, ArrowLeft } from 'lucide-react'

export function Header() {
  const { activeTool, setActiveTool } = useAppStore()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => setActiveTool('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">Y</span>
              <FileText className="w-3 h-3 text-blue-200 absolute bottom-0.5 right-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-blue-900 leading-tight">
                YadavjiPDF
              </span>
              <span className="text-[10px] text-blue-500 leading-tight hidden sm:block">
                Made in India 🇮🇳
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {['merge', 'split', 'compress'].map((tool) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool as ToolType)}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 capitalize transition-colors"
              >
                {tool} PDF
              </button>
            ))}
            <div className="relative group">
              <button className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Convert ▾
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-blue-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {[
                  { id: 'image-to-pdf', label: 'Image to PDF' },
                  { id: 'word-to-pdf', label: 'Word to PDF' },
                  { id: 'excel-to-pdf', label: 'Excel to PDF' },
                  { id: 'pdf-to-word', label: 'PDF to Word' },
                  { id: 'pdf-to-excel', label: 'PDF to Excel' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTool(item.id as ToolType)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {activeTool !== 'home' && (
            <button
              onClick={() => setActiveTool('home')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 md:hidden transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
