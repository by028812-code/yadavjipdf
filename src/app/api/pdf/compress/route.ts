import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const quality = (formData.get('quality') as string) || 'medium'

    if (!file) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File is not a PDF' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const originalSize = bytes.byteLength

    const pdfDoc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    })

    if (quality === 'screen' || quality === 'low') {
      pdfDoc.setTitle('')
      pdfDoc.setAuthor('')
      pdfDoc.setSubject('')
      pdfDoc.setKeywords([])
      pdfDoc.setProducer('')
      pdfDoc.setCreator('')
    }

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    })

    const compressedSize = compressedBytes.byteLength
    const savingsPercent = originalSize > 0
      ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
      : '0'

    const message = Number(savingsPercent) > 0
      ? `PDF compressed! Size reduced by ${savingsPercent}%`
      : `PDF optimized. File size: ${(compressedSize / 1024).toFixed(1)} KB`

    return new NextResponse(compressedBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="compressed.pdf"',
        'X-Message': message,
        'X-Original-Size': String(originalSize),
        'X-Compressed-Size': String(compressedSize),
        'X-Savings-Percent': `${savingsPercent}%`,
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[compress] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
