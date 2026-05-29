import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export async function POST(req: NextRequest) {
  try {
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
            pageIndices.push(i - 1)
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
      pageIndices = Array.from({ length: totalPages }, (_, i) => i)
    }

    if (pageIndices.length === 0) {
      return NextResponse.json({ error: 'No valid pages specified' }, { status: 400 })
    }

    pageIndices = [...new Set(pageIndices)].sort((a, b) => a - b)

    const splitPdf = await PDFDocument.create()
    const copiedPages = await splitPdf.copyPages(pdfDoc, pageIndices)
    for (const page of copiedPages) {
      splitPdf.addPage(page)
    }

    const splitBytes = await splitPdf.save()

    return new NextResponse(splitBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="split.pdf"',
        'X-Message': `Successfully extracted ${pageIndices.length} pages from ${totalPages} total pages`,
        'X-Total-Pages': String(totalPages),
        'X-Extracted-Pages': String(pageIndices.length),
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[split] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
