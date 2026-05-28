import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

const execAsync = promisify(exec)
const UPLOAD_DIR = join(process.cwd(), 'upload')
const DOWNLOAD_DIR = join(process.cwd(), 'download')

const VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv']

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    await mkdir(DOWNLOAD_DIR, { recursive: true })

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Please upload an Excel file' }, { status: 400 })
    }

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!VALID_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: 'File is not a supported spreadsheet format. Please upload .xlsx, .xls, or .csv files.' },
        { status: 400 }
      )
    }

    // Save uploaded file
    const inputPath = join(UPLOAD_DIR, `excel_input_${jobId}${ext}`)
    const bytes = await file.arrayBuffer()
    await writeFile(inputPath, Buffer.from(bytes))

    // Convert using LibreOffice via Python script
    const scriptPath = join(process.cwd(), 'scripts', 'excel_to_pdf.py')
    const { stdout, stderr } = await execAsync(
      `python3 ${scriptPath} ${inputPath} ${DOWNLOAD_DIR}`,
      { timeout: 90000, maxBuffer: 50 * 1024 * 1024 }
    )

    // Clean up input file
    await unlink(inputPath).catch(() => {})

    // Parse output path from stdout
    const outputFileName = stdout.trim().split('/').pop()
    if (!outputFileName) {
      return NextResponse.json(
        { error: 'Conversion failed – output file could not be located' },
        { status: 500 }
      )
    }

    const outputPath = join(DOWNLOAD_DIR, outputFileName)
    try {
      await readFile(outputPath)
    } catch {
      return NextResponse.json(
        { error: 'Conversion failed – Please recheck your file.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=${outputFileName}`,
      fileName: outputFileName,
      message: 'Successfully converted spreadsheet to PDF'
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[excel-to-pdf] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
