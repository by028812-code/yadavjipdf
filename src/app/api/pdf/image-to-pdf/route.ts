import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

const DOWNLOAD_DIR = join(process.cwd(), 'download')

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'image/jpg', 'image/bmp', 'image/tiff'
]

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif']

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
    await mkdir(DOWNLOAD_DIR, { recursive: true })

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const orientation = (formData.get('orientation') as string) || 'portrait'
    const pageSize = (formData.get('pageSize') as string) || 'a4'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Please upload at least one image' }, { status: 400 })
    }

    // Validate image files
    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type) && !SUPPORTED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a supported image format. Please use JPG, PNG, or WebP.` },
          { status: 400 }
        )
      }
    }

    const pdfDoc = await PDFDocument.create()

    // Page dimensions in points (1 inch = 72 points)
    const pageSizes: Record<string, { width: number; height: number }> = {
      'a4': { width: 595.28, height: 841.89 },
      'letter': { width: 612, height: 792 },
      'legal': { width: 612, height: 1008 },
    }

    const dims = pageSizes[pageSize] || pageSizes['a4']
    const pageWidth = orientation === 'landscape' ? dims.height : dims.width
    const pageHeight = orientation === 'landscape' ? dims.width : dims.height

    for (const file of files) {
      const imageBytes = await file.arrayBuffer()
      
      // Convert image to PNG/JPEG using sharp for consistency
      let processedImage: Buffer
      const sharpInstance = sharp(Buffer.from(imageBytes))
      const metadata = await sharpInstance.metadata()
      
      if (metadata.channels === 4 || metadata.format === 'png' || metadata.format === 'webp') {
        // Convert to PNG for alpha channel support
        processedImage = await sharpInstance.png().toBuffer()
      } else {
        // Convert to JPEG for smaller size
        processedImage = await sharpInstance.jpeg({ quality: 90 }).toBuffer()
      }

      // Embed image in PDF
      let image
      const isPng = metadata.channels === 4 || metadata.format === 'png' || metadata.format === 'webp'
      if (isPng) {
        image = await pdfDoc.embedPng(processedImage)
      } else {
        image = await pdfDoc.embedJpg(processedImage)
      }

      // Scale image to fit page with margins
      const margin = 36 // 0.5 inch margin
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
    const outputPath = join(DOWNLOAD_DIR, `images_to_pdf_${jobId}.pdf`)
    await writeFile(outputPath, Buffer.from(pdfBytes))

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=images_to_pdf_${jobId}.pdf`,
      fileName: `images_to_pdf_${jobId}.pdf`,
      message: `Successfully converted ${files.length} image(s) to PDF`
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[image-to-pdf] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
