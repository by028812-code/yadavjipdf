import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const DOWNLOAD_DIR = join(process.cwd(), 'download')

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
    await mkdir(DOWNLOAD_DIR, { recursive: true })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const pagesStr = formData.get('pages') as string

    if (!file) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File is not a PDF' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const totalPages = pdfDoc.getPageCount()

    // Parse page ranges (e.g., "1-3,5,7-9")
    let pageIndices: number[] = []
    if (pagesStr && pagesStr.trim()) {
      const parts = pagesStr.split(',').map(s => s.trim()).filter(Boolean)
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number)
          if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
            return NextResponse.json(
              { error: `Invalid page range: ${part}. Total pages: ${totalPages}` },
              { status: 400 }
            )
          }
          for (let i = start; i <= end; i++) {
            pageIndices.push(i - 1) // Convert to 0-indexed
          }
        } else {
          const pageNum = Number(part)
          if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
            return NextResponse.json(
              { error: `Invalid page number: ${part}. Total pages: ${totalPages}` },
              { status: 400 }
            )
          }
          pageIndices.push(pageNum - 1)
        }
      }
    } else {
      // Default: extract all pages
      pageIndices = Array.from({ length: totalPages }, (_, i) => i)
    }

    if (pageIndices.length === 0) {
      return NextResponse.json({ error: 'No valid pages specified' }, { status: 400 })
    }

    // Remove duplicates and sort
    pageIndices = [...new Set(pageIndices)].sort((a, b) => a - b)

    const splitPdf = await PDFDocument.create()
    const copiedPages = await splitPdf.copyPages(pdfDoc, pageIndices)
    for (const page of copiedPages) {
      splitPdf.addPage(page)
    }

    const splitBytes = await splitPdf.save()
    const outputPath = join(DOWNLOAD_DIR, `split_${jobId}.pdf`)
    await writeFile(outputPath, Buffer.from(splitBytes))

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=split_${jobId}.pdf`,
      fileName: `split_${jobId}.pdf`,
      message: `Successfully extracted ${pageIndices.length} pages from ${totalPages} total pages`,
      totalPages,
      extractedPages: pageIndices.length
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[split] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
