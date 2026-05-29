import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

const execAsync = promisify(exec)
const UPLOAD_DIR = join(process.cwd(), 'upload')
const DOWNLOAD_DIR = join(process.cwd(), 'download')

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    await mkdir(DOWNLOAD_DIR, { recursive: true })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const quality = (formData.get('quality') as string) || 'ebook' // screen, ebook, printer, prepress

    if (!file) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File is not a PDF' }, { status: 400 })
    }

    const validQualities = ['screen', 'ebook', 'printer', 'prepress']
    if (!validQualities.includes(quality)) {
      return NextResponse.json({ error: 'Invalid quality level' }, { status: 400 })
    }

    // Save uploaded file
    const inputPath = join(UPLOAD_DIR, `compress_input_${jobId}.pdf`)
    const outputPath = join(DOWNLOAD_DIR, `compressed_${jobId}.pdf`)
    const bytes = await file.arrayBuffer()
    await writeFile(inputPath, Buffer.from(bytes))

    const originalSize = bytes.byteLength

    // Run Ghostscript compression via Python script
    const scriptPath = join(process.cwd(), 'scripts', 'compress.py')
    const { stdout, stderr } = await execAsync(
      `python3 ${scriptPath} ${inputPath} ${outputPath} ${quality}`,
      { timeout: 90000, maxBuffer: 50 * 1024 * 1024 }
    )

    // Clean up input file
    await unlink(inputPath).catch(() => {})

    // Check output
    try {
      const compressedData = await readFile(outputPath)
      const compressedSize = compressedData.byteLength
      const savingsPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1)

      return NextResponse.json({
        success: true,
        downloadUrl: `/api/pdf/download?file=compressed_${jobId}.pdf`,
        fileName: `compressed_${jobId}.pdf`,
        originalSize,
        compressedSize,
        savingsPercent: `${savingsPercent}%`,
        message: `PDF compressed! Size reduced by ${savingsPercent}%`
      })
    } catch {
      return NextResponse.json(
        { error: 'Compression failed – output file could not be created' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[compress] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
