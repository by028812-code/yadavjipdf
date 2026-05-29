import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const orientation = (formData.get('orientation') as string) || 'portrait'
    const pageSize = (formData.get('pageSize') as string) || 'a4'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Please upload at least one image' }, { status: 400 })
    }

    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      if (!SUPPORTED_EXTENSIONS.includes(ext) && !file.type.match(/^image\/(jpeg|png)$/)) {
        return NextResponse.json(
          { error: `File "${file.name}" is not supported. Please use JPG or PNG images only.` },
          { status: 400 }
        )
      }
    }

    const pdfDoc = await PDFDocument.create()

    const pageSizes: Record<string, { width: number; height: number }> = {
      'a4': { width: 595.28, height: 841.89 },
      'letter': { width: 612, height: 792 },
      'legal': { width: 612, height: 1008 },
    }

    const dims = pageSizes[pageSize] || pageSizes['a4']
    const pageWidth = orientation === 'landscape' ? dims.height : dims.width
    const pageHeight = orientation === 'landscape' ? dims.width : dims.height

    for (const file of files) {
      const imageBytes = new Uint8Array(await file.arrayBuffer())
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

      let image
      try {
        if (ext === '.png') {
          image = await pdfDoc.embedPng(imageBytes)
        } else {
          image = await pdfDoc.embedJpg(imageBytes)
        }
      } catch {
        // If embedding fails, try the other format
        try {
          if (ext === '.png') {
            image = await pdfDoc.embedJpg(imageBytes)
          } else {
            image = await pdfDoc.embedPng(imageBytes)
          }
        } catch {
          return NextResponse.json(
            { error: `Could not process image "${file.name}". Please try a different image.` },
            { status: 400 }
          )
        }
      }

      const margin = 36
      const maxWidth = pageWidth - 2 * margin
      const maxHeight = pageHeight - 2 * margin
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height)
      const imgWidth = image.width * scale
      const imgHeight = image.height * scale

      const page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawImage(image, {
        x: (pageWidth - imgWidth) / 2,
        y: (pageHeight - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
      })
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="images_to_pdf.pdf"',
        'X-Message': `Successfully converted ${files.length} image(s) to PDF`,
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[image-to-pdf] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
