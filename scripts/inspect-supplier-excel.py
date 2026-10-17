import os
import zipfile
import xml.etree.ElementTree as ET

def read_xlsx_headers_and_sample(file_path, max_rows=5):
    print(f"\n{'='*70}\nInspecting: {os.path.basename(file_path)}\n{'='*70}")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            # 1. Read shared strings
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                    texts = [t.text for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text]
                    shared_strings.append(''.join(texts))

            # 2. Read first sheet
            sheet_data = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
            rows = sheet_data.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
            
            row_count = 0
            for r in rows:
                row_vals = []
                for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    val = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    text = val.text if val is not None else ""
                    t_attr = c.attrib.get('t')
                    if t_attr == 's' and text:
                        text = shared_strings[int(text)]
                    row_vals.append(text)
                
                if row_vals:
                    if row_count == 0:
                        print(f"COLUMNS ({len(row_vals)}):")
                        for idx, col in enumerate(row_vals[:20]):
                            print(f"  [{idx}] {col}")
                        if len(row_vals) > 20:
                            print(f"  ... and {len(row_vals) - 20} more columns")
                        print("\nSAMPLE ROWS:")
                    else:
                        print(f"Row {row_count}: {row_vals[:10]}")
                    
                    row_count += 1
                    if row_count > max_rows:
                        break
            print(f"Total rows in sheet preview: {len(rows)}")
    except Exception as e:
        print(f"Error reading xlsx: {e}")

base_dir = r"d:\xampp\htdocs\SAN Furniture\Dropship Suppliers"

# 1. FTG Master Products
read_xlsx_headers_and_sample(os.path.join(base_dir, "Furniture to Go", "001Master Product Details for ALL PRODUCTS.xlsx"))

# 2. FTG Price List
read_xlsx_headers_and_sample(os.path.join(base_dir, "Furniture to Go", "Pricelist FTG £_06_2020.xlsx"))

# 3. Amos Mann 2025 Stock Feed
read_xlsx_headers_and_sample(os.path.join(base_dir, "Amos Mann Customer Folder", "LATEST STOCK FEED", "AmosMann Furniture Stock Feed 2025.xlsx"))
