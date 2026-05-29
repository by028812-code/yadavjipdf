import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { PDFParse } from 'pdf-parse'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

const UPLOAD_DIR = join(process.cwd(), 'upload')
const DOWNLOAD_DIR = join(process.cwd(), 'download')

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    await mkdir(DOWNLOAD_DIR, { recursive: true })

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File is not a PDF' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()

    // Extract text from PDF using pdf-parse
    const parser = new PDFParse(Buffer.from(bytes))
    const pdfData = await parser.getText()
    const text = pdfData

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. It may be image-based.' },
        { status: 400 }
      )
    }

    // Create DOCX using docx library
    const paragraphs: Paragraph[] = []
    
    // Title
    paragraphs.push(
      new Paragraph({
        text: file.name.replace(/\.pdf$/i, ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      })
    )

    // Split text into paragraphs and add to document
    const lines = text.split(/\n+/).filter(line => line.trim().length > 0)
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Detect if it's a heading (short line, possibly all caps or larger)
      if (trimmed.length < 60 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        )
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                size: 22,
              }),
            ],
            spacing: { after: 120 },
          })
        )
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    })

    const docxBuffer = await Packer.toBuffer(doc)
    const outputPath = join(DOWNLOAD_DIR, `converted_${jobId}.docx`)
    await writeFile(outputPath, docxBuffer)

    const outputFileName = `converted_${jobId}.docx`
    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=${outputFileName}`,
      fileName: outputFileName,
      message: `Successfully converted PDF to Word (${lines.length} paragraphs extracted)`
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[pdf-to-word] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
