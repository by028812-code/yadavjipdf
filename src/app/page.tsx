'use client'

import { useAppStore, ToolType } from '@/lib/store'
import { Header } from '@/components/pdf-tools/Header'
import { Hero } from '@/components/pdf-tools/Hero'
import { ToolGrid } from '@/components/pdf-tools/ToolGrid'
import { ToolWorkspace } from '@/components/pdf-tools/ToolWorkspace'
import { Footer } from '@/components/pdf-tools/Footer'

export default function YadavjiPDF() {
  const activeTool = useAppStore((s) => s.activeTool)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        {activeTool === 'home' ? (
          <>
            <Hero />
            <ToolGrid />
          </>
        ) : (
          <ToolWorkspace tool={activeTool} />
        )}
      </main>
      <Footer />
    </div>
  )
}
