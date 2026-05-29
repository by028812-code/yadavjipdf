import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import pdf from 'pdf-parse'
import ExcelJS from 'exceljs'

const DOWNLOAD_DIR = join(process.cwd(), 'download')

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
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
    const pdfData = await pdf(Buffer.from(bytes))
    const text = pdfData.text

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. It may be image-based.' },
        { status: 400 }
      )
    }

    // Parse text into table-like structure
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    
    // Try to detect tabular data (lines with multiple spaces/tabs as column separators)
    const rows: string[][] = []
    let maxCols = 1

    for (const line of lines) {
      // Split by multiple spaces or tabs
      const cells = line
        .split(/\s{2,}|\t/)
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
      
      if (cells.length > 1) {
        rows.push(cells)
        maxCols = Math.max(maxCols, cells.length)
      } else if (cells.length === 1) {
        rows.push([cells[0]])
      }
    }

    // Create Excel file using ExcelJS
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Extracted Data')

    // Set columns
    const columns = Array.from({ length: maxCols }, (_, i) => ({
      header: `Column ${i + 1}`,
      key: `col${i}`,
      width: 20,
    }))
    worksheet.columns = columns

    // Style header
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FF1a1a1a' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    }
    headerRow.alignment = { horizontal: 'center' }

    // Add data rows
    for (const row of rows) {
      const rowData: Record<string, string> = {}
      row.forEach((cell, i) => {
        rowData[`col${i}`] = cell
      })
      worksheet.addRow(rowData)
    }

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 10
      column.eachCell?.((cell) => {
        const cellLength = String(cell.value || '').length
        maxLength = Math.max(maxLength, cellLength + 2)
      })
      column.width = Math.min(maxLength, 50)
    })

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer()
    const outputPath = join(DOWNLOAD_DIR, `converted_${jobId}.xlsx`)
    await writeFile(outputPath, Buffer.from(buffer))

    const outputFileName = `converted_${jobId}.xlsx`
    return NextResponse.json({
      success: true,
      downloadUrl: `/api/pdf/download?file=${outputFileName}`,
      fileName: outputFileName,
      message: `Successfully extracted ${rows.length} rows from PDF to Excel`
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[pdf-to-excel] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
