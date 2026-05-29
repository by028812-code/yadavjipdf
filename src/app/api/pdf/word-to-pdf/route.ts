import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import mammoth from 'mammoth'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
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
      .replace(/<li>/gi, '  • ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim()

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 595.28
    const pageHeight = 841.89
    const margin = 60
    const fontSize = 11
    const lineHeight = fontSize * 1.5
    const maxTextWidth = pageWidth - 2 * margin

    // Title
    const titleText = file.name.replace(/\.[^.]+$/, '')
    const titleSize = 18
    const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize)

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    // Draw title
    page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y,
      size: titleSize,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })
    y -= titleSize * 2

    // Draw separator line
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= lineHeight

    // Process paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim())

    for (const paragraph of paragraphs) {
      const lines = paragraph.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // Word wrap
        const words = trimmedLine.split(/\s+/)
        let currentLine = ''

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          const testWidth = font.widthOfTextAtSize(testLine, fontSize)

          if (testWidth > maxTextWidth && currentLine) {
            // Draw current line
            if (y < margin + lineHeight) {
              page = pdfDoc.addPage([pageWidth, pageHeight])
              y = pageHeight - margin
            }

            const isBullet = currentLine.startsWith('•') || currentLine.startsWith('-')
            page.drawText(currentLine, {
              x: isBullet ? margin + 10 : margin,
              y,
              size: fontSize,
              font,
              color: rgb(0.15, 0.15, 0.15),
            })
            y -= lineHeight
            currentLine = word
          } else {
            currentLine = testLine
          }
        }

        // Draw remaining text
        if (currentLine) {
          if (y < margin + lineHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight])
            y = pageHeight - margin
          }

          const isBullet = currentLine.startsWith('•') || currentLine.startsWith('-')
          page.drawText(currentLine, {
            x: isBullet ? margin + 10 : margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.15, 0.15, 0.15),
          })
          y -= lineHeight
        }
      }

      // Paragraph spacing
      y -= lineHeight * 0.3
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="converted.pdf"',
        'X-Message': 'Successfully converted Word document to PDF',
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[word-to-pdf] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
