import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: 'Please upload at least 2 PDF files to merge' },
        { status: 400 }
      )
    }

    for (const file of files) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a PDF. Only PDF files can be merged.` },
          { status: 400 }
        )
      }
    }

    const mergedPdf = await PDFDocument.create()

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
      for (const page of pages) {
        mergedPdf.addPage(page)
      }
    }

    const mergedBytes = await mergedPdf.save()

    return new NextResponse(mergedBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="merged.pdf"',
        'X-Message': `Successfully merged ${files.length} PDFs`,
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[merge] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
