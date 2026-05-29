import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import ExcelJS from 'exceljs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Please upload an Excel file' }, { status: 400 })
    }

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return NextResponse.json(
        { error: 'File is not a supported spreadsheet format. Please upload .xlsx, .xls, or .csv files.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()

    // Read spreadsheet using ExcelJS
    const workbook = new ExcelJS.Workbook()

    if (ext === '.csv') {
      await workbook.csv.read(Buffer.from(bytes))
    } else {
      await workbook.xlsx.load(Buffer.from(bytes))
    }

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 841.89 // A4 landscape
    const pageHeight = 595.28
    const margin = 40
    const headerFontSize = 7
    const cellFontSize = 7
    const rowHeight = 14

    let isFirstSheet = true

    workbook.eachSheet((worksheet) => {
      if (!isFirstSheet) {
        pdfDoc.addPage([pageWidth, pageHeight])
      }
      isFirstSheet = false

      let page = pdfDoc.pages[pdfDoc.getPageCount() - 1]
      let y = pageHeight - margin

      // Sheet title
      const titleText = `${file.name.replace(/\.[^.]+$/, '')} - ${worksheet.name}`
      const titleWidth = boldFont.widthOfTextAtSize(titleText, 12)
      page.drawText(titleText, {
        x: (pageWidth - titleWidth) / 2,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })
      y -= 24

      const colCount = worksheet.columnCount || 1
      const availableWidth = pageWidth - 2 * margin
      const colWidth = Math.min(availableWidth / colCount, 130)

      // Draw header row background
      const headerRow = worksheet.getRow(1)
      if (headerRow) {
        page.drawRectangle({
          x: margin,
          y: y - rowHeight + 4,
          width: availableWidth,
          height: rowHeight,
          color: rgb(0.91, 0.94, 1.0), // light blue
        })

        let x = margin
        headerRow.eachCell((cell) => {
          const cellText = String(cell.value || '').substring(0, 20)
          const truncated = cellText.length >= 20 ? cellText + '..' : cellText
          page.drawText(truncated, {
            x: x + 3,
            y,
            size: headerFontSize,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          })
          x += colWidth
        })
        y -= rowHeight
      }

      // Draw data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // skip header

        if (y < margin + rowHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - margin
        }

        let x = margin
        row.eachCell((cell) => {
          const cellText = String(cell.value || '').substring(0, 20)
          const truncated = cellText.length >= 20 ? cellText + '..' : cellText
          page.drawText(truncated, {
            x: x + 3,
            y,
            size: cellFontSize,
            font,
            color: rgb(0.15, 0.15, 0.15),
          })
          x += colWidth
        })
        y -= rowHeight
      })
    })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="converted.pdf"',
        'X-Message': 'Successfully converted spreadsheet to PDF',
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[excel-to-pdf] Error: ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Processing failed – Please recheck your file.' },
      { status: 500 }
    )
  }
}
