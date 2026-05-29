#!/usr/bin/env python3
"""Convert Excel (XLSX/XLS/CSV) to PDF using LibreOffice"""
import sys
import subprocess
import os

def convert_excel_to_pdf(input_path, output_dir):
    """Convert XLSX/XLS/CSV to PDF using LibreOffice headless mode"""
    try:
        cmd = [
            'libreoffice', '--headless', '--convert-to', 'pdf',
            '--outdir', output_dir,
            input_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if result.returncode != 0:
            print(f"LibreOffice error: {result.stderr}", file=sys.stderr)
            sys.exit(1)
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{base_name}.pdf")
        if os.path.exists(output_path):
            print(output_path)
        else:
            print(f"Output file not found: {output_path}", file=sys.stderr)
            sys.exit(1)
    except subprocess.TimeoutExpired:
        print("LibreOffice timeout after 90s", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Excel to PDF error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: excel_to_pdf.py <input_path> <output_dir>", file=sys.stderr)
        sys.exit(1)
    convert_excel_to_pdf(sys.argv[1], sys.argv[2])
