#!/usr/bin/env python3
"""Convert PDF to Word (DOCX) using pdf2docx"""
import sys
import os

def convert_pdf_to_word(input_path, output_path):
    """Convert PDF to DOCX using pdf2docx library"""
    try:
        from pdf2docx import Converter
        cv = Converter(input_path)
        cv.convert(output_path)
        cv.close()
        print(output_path)
    except Exception as e:
        print(f"PDF to Word error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: pdf_to_word.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)
    convert_pdf_to_word(sys.argv[1], sys.argv[2])
