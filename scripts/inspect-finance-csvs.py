from pathlib import Path
import csv
from collections import Counter

base = Path('/home/ubuntu/upload')
files = [
    base / 'Financeiro-Agosto.csv',
    base / 'Financeiro-Setembro.csv',
    base / 'Financeiro-Outubro.csv',
    base / 'Financeiro-Dívidas.csv',
]

for path in files:
    print(f'FILE\t{path.name}')
    raw = path.read_bytes()
    print(f'BYTES\t{len(raw)}')
    text = raw.decode('utf-8-sig', errors='replace')
    sample = text[:2000]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\\t')
        delimiter = dialect.delimiter
    except csv.Error:
        delimiter = ';' if ';' in sample else ','
    rows = list(csv.DictReader(text.splitlines(), delimiter=delimiter))
    print(f'DELIMITER\t{repr(delimiter)}')
    print(f'HEADERS\t{rows[0].keys() if rows else []}')
    print(f'ROWS\t{len(rows)}')
    for key in (rows[0].keys() if rows else []):
        values = [str(row.get(key, '')).strip() for row in rows]
        nonempty = [v for v in values if v]
        print(f'COLUMN\t{key}\tNONEMPTY={len(nonempty)}\tSAMPLE={nonempty[:5]}')
    print('FIRST_ROWS')
    for row in rows[:3]:
        print(row)
    print('---')
