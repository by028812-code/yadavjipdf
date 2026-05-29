import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import ExcelJS from 'exceljs'

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

    // Extract text from PDF using pdf-parse
    const parser = new PDFParse(new Uint8Array(bytes))
    const text = await parser.getText()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. It may be image-based.' },
        { status: 400 }
      )
    }

    const lines = text.split('\n').filter(line => line.trim().length > 0)

    const rows: string[][] = []
    let maxCols = 1

    for (const line of lines) {
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

    const columns = Array.from({ length: maxCols }, (_, i) => ({
      header: `Column ${i + 1}`,
      key: `col${i}`,
      width: 20,
    }))
    worksheet.columns = columns

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FF1a1a1a' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    }
    headerRow.alignment = { horizontal: 'center' }

    for (const row of rows) {
      const rowData: Record<string, string> = {}
      row.forEach((cell, i) => {
        rowData[`col${i}`] = cell
      })
      worksheet.addRow(rowData)
    }

    worksheet.columns.forEach((column) => {
      let maxLength = 10
      column.eachCell?.((cell) => {
        const cellLength = String(cell.value || '').length
        maxLength = Math.max(maxLength, cellLength + 2)
      })
      column.width = Math.min(maxLength, 50)
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="converted.xlsx"',
        'X-Message': `Successfully extracted ${rows.length} rows from PDF to Excel`,
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[pdf-to-excel] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
