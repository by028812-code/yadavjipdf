#!/usr/bin/env python3
"""Convert PDF tables to Excel (XLSX) using tabula-py"""
import sys
import os

def convert_pdf_to_excel(input_path, output_path):
    """Extract tables from PDF and save as XLSX using tabula-py"""
    try:
        import tabula
        import pandas as pd
        
        # Read all tables from PDF
        dfs = tabula.read_pdf(input_path, pages='all', multiple_tables=True)
        
        if not dfs or len(dfs) == 0:
            print("No tables found in PDF", file=sys.stderr)
            sys.exit(1)
        
        # Write all tables to XLSX
        with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
            for i, df in enumerate(dfs):
                df.to_excel(writer, sheet_name=f'Table_{i+1}', index=False)
        
        print(output_path)
    except Exception as e:
        print(f"PDF to Excel error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: pdf_to_excel.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)
    convert_pdf_to_excel(sys.argv[1], sys.argv[2])
