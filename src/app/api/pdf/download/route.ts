import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

const DOWNLOAD_DIR = join(process.cwd(), 'download')

export async function GET(req: NextRequest) {
  try {
    const fileName = req.nextUrl.searchParams.get('file')
    if (!fileName) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 })
    }

    // Prevent directory traversal attacks
    const sanitizedFileName = fileName.replace(/\.\./g, '').replace(/\//g, '').replace(/\\/g, '')
    const filePath = join(DOWNLOAD_DIR, sanitizedFileName)

    // Verify file exists
    try {
      await stat(filePath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    
    // Determine content type
    const ext = sanitizedFileName.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
    const contentType = contentTypes[ext || ''] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizedFileName}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[download] Error at ${err.stack || err.message}`)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}
