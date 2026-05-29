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

    // Load and rewrite PDF using pdf-lib to remove unused objects
    const pdfDoc = await PDFDocument.load(bytes, { 
      ignoreEncryption: true,
      updateMetadata: false 
    })

    // Apply compression based on quality level
    if (quality === 'screen' || quality === 'low') {
      // Remove metadata for maximum compression
      pdfDoc.setTitle('')
      pdfDoc.setAuthor('')
      pdfDoc.setSubject('')
      pdfDoc.setKeywords([])
      pdfDoc.setProducer('')
      pdfDoc.setCreator('')
    }

    // Save with object stream compression
    const compressedBytes = await pdfDoc.save({ 
      useObjectStreams: true,
      addDefaultPage: false,
    })

    const outputPath = join(DOWNLOAD_DIR, `compressed_${jobId}.pdf`)
    await writeFile(outputPath, Buffer.from(compressedBytes))

    const compressedSize = compressedBytes.byteLength
    const savingsPercent = originalSize > 0 
      ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
      : '0'

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=compressed_${jobId}.pdf`,
      fileName: `compressed_${jobId}.pdf`,
      originalSize,
      compressedSize,
      savingsPercent: `${savingsPercent}%`,
      message: Number(savingsPercent) > 0 
        ? `PDF compressed! Size reduced by ${savingsPercent}%`
        : `PDF optimized. File size: ${(compressedSize / 1024).toFixed(1)} KB`
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[compress] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
