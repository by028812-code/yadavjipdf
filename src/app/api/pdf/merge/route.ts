import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = join(process.cwd(), 'upload')
const DOWNLOAD_DIR = join(process.cwd(), 'download')

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    await mkdir(DOWNLOAD_DIR, { recursive: true })

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: 'Please upload at least 2 PDF files to merge' },
        { status: 400 }
      )
    }

    // Validate all files are PDFs
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
    const outputPath = join(DOWNLOAD_DIR, `merged_${jobId}.pdf`)
    await writeFile(outputPath, Buffer.from(mergedBytes))

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=merged_${jobId}.pdf`,
      fileName: `merged_${jobId}.pdf`,
      message: `Successfully merged ${files.length} PDFs`
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[merge] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
