import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import mammoth from 'mammoth'
import PDFDocument from 'pdfkit'

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
      return NextResponse.json({ error: 'Please upload a Word file' }, { status: 400 })
    }

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!['.docx', '.doc'].includes(ext)) {
      return NextResponse.json(
        { error: 'File is not a Word document. Please upload .docx or .doc files.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()

    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) })
    const html = result.value

    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract content from the Word document.' },
        { status: 400 }
      )
    }

    // Strip HTML tags for plain text
    const text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim()

    // Generate PDF using PDFKit
    const outputPath = join(DOWNLOAD_DIR, `word_to_pdf_${jobId}.pdf`)
    
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      })
      
      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => {
        writeFile(outputPath, Buffer.concat(chunks))
          .then(() => resolve())
          .catch(reject)
      })
      doc.on('error', reject)

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text(file.name.replace(/\.[^.]+$/, ''), {
        align: 'center',
      })
      doc.moveDown(1.5)

      // Body text
      doc.fontSize(11).font('Helvetica')
      
      const paragraphs = text.split('\n\n').filter(p => p.trim())
      for (const paragraph of paragraphs) {
        const lines = paragraph.split('\n')
        for (const line of lines) {
          if (line.startsWith('• ') || line.startsWith('- ')) {
            doc.text(line, { indent: 20 })
          } else {
            doc.text(line)
          }
        }
        doc.moveDown(0.5)
      }

      doc.end()
    })

    const outputFileName = `word_to_pdf_${jobId}.pdf`
    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=${outputFileName}`,
      fileName: outputFileName,
      message: 'Successfully converted Word document to PDF'
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[word-to-pdf] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
