import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

const DOWNLOAD_DIR = join(process.cwd(), 'download')

export async function POST(req: NextRequest) {
  const jobId = uuidv4()
  try {
    await mkdir(DOWNLOAD_DIR, { recursive: true })

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

    // Generate PDF using PDFKit
    const outputPath = join(DOWNLOAD_DIR, `excel_to_pdf_${jobId}.pdf`)
    
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 40, right: 40 },
        layout: 'landscape',
      })
      
      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => {
        writeFile(outputPath, Buffer.concat(chunks))
          .then(() => resolve())
          .catch(reject)
      })
      doc.on('error', reject)

      // Title
      doc.fontSize(16).font('Helvetica-Bold').text(file.name.replace(/\.[^.]+$/, ''), {
        align: 'center',
      })
      doc.moveDown(1)

      // Process each worksheet
      workbook.eachSheet((worksheet, sheetId) => {
        if (sheetId > 1) {
          doc.addPage({ layout: 'landscape' })
        }

        doc.fontSize(12).font('Helvetica-Bold').text(`Sheet: ${worksheet.name}`)
        doc.moveDown(0.5)

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
        const colCount = worksheet.columnCount || 1
        const colWidth = Math.min(pageWidth / colCount, 150)

        let y = doc.y

        worksheet.eachRow((row, rowNumber) => {
          // Check if we need a new page
          if (y > doc.page.height - doc.page.margins.bottom - 20) {
            doc.addPage({ layout: 'landscape' })
            y = doc.page.margins.top
          }

          let x = doc.page.margins.left
          const isHeader = rowNumber === 1

          row.eachCell((cell, colNumber) => {
            const cellText = String(cell.value || '')
            const truncated = cellText.length > 25 ? cellText.substring(0, 25) + '...' : cellText

            if (isHeader) {
              doc.fontSize(8).font('Helvetica-Bold')
            } else {
              doc.fontSize(7).font('Helvetica')
            }

            // Draw cell background for header
            if (isHeader) {
              doc.save()
              doc.rect(x, y - 8, colWidth, 14).fill('#E8F0FE')
              doc.restore()
              doc.fillColor('#1a1a1a')
            }

            doc.text(truncated, x + 2, y - 6, {
              width: colWidth - 4,
              height: 12,
              ellipsis: true,
            })

            x += colWidth
          })

          y += 16
        })
      })

      doc.end()
    })

    const outputFileName = `excel_to_pdf_${jobId}.pdf`
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
