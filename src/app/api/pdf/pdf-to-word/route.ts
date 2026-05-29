import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import PDFParser from 'pdf2json'

export const maxDuration = 60

function extractTextFromPdf(bytes: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1)
    parser.on('pdfParser_dataReady', () => {
      const text = parser.getRawTextContent()
      parser.destroy()
      resolve(text || '')
    })
    parser.on('pdfParser_dataError', (err: { parserError: Error } | Error) => {
      parser.destroy()
      const error = err instanceof Error ? err : (err as { parserError: Error }).parserError
      reject(error)
    })
    parser.parseBuffer(Buffer.from(bytes))
  })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File is not a PDF' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const text = await extractTextFromPdf(bytes)

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. It may be image-based or password-protected.' },
        { status: 400 }
      )
    }

    const paragraphs: Paragraph[] = []

    paragraphs.push(
      new Paragraph({
        text: file.name.replace(/\.pdf$/i, ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      })
    )

    const lines = text.split(/\n+/).filter(line => line.trim().length > 0)

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length < 60 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, bold: true, size: 28 })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        )
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, size: 22 })],
            spacing: { after: 120 },
          })
        )
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    })

    const docxBuffer = await Packer.toBuffer(doc)

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="converted.docx"',
        'X-Message': `Successfully converted PDF to Word (${lines.length} paragraphs extracted)`,
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[pdf-to-word] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
