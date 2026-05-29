#!/usr/bin/env python3
"""Compress PDF using Ghostscript"""
import sys
import subprocess
import os

def compress_pdf(input_path, output_path, quality='screen'):
    """
    Compress PDF using Ghostscript.
    Quality levels: screen (72dpi), ebook (150dpi), printer (300dpi), prepress (300dpi)
    """
    quality_map = {
        'screen': '/screen',
        'ebook': '/ebook',
        'printer': '/printer',
        'prepress': '/prepress'
    }
    gs_quality = quality_map.get(quality, '/ebook')

    try:
        cmd = [
            'gs', '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            f'-dPDFSETTINGS={gs_quality}',
            '-dNOPAUSE', '-dQUIET', '-dBATCH',
            f'-sOutputFile={output_path}',
            input_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if result.returncode != 0:
            print(f"Ghostscript error: {result.stderr}", file=sys.stderr)
            sys.exit(1)
        print(f"Compressed: {output_path}")
    except subprocess.TimeoutExpired:
        print("Ghostscript timeout after 90s", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Compress error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: compress.py <input_path> <output_path> [quality]", file=sys.stderr)
        sys.exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    quality = sys.argv[3] if len(sys.argv) > 3 else 'ebook'
    compress_pdf(input_path, output_path, quality)
