import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function buildRows<T>(data: T[], columns: ExportColumn<T>[]): (string | number | null | undefined)[][] {
  const header = columns.map((c) => c.header);
  const rows = data.map((row) => columns.map((c) => c.accessor(row)));
  return [header, ...rows];
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  const rows = buildRows(data, columns);
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const val = cell == null ? '' : String(cell);
          return val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(',')
    )
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = 'Sheet1'
) {
  const rows = buildRows(data, columns);
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 컬럼 너비 자동 조정
  const colWidths = columns.map((col) => {
    const maxLen = Math.max(
      col.header.length,
      ...data.map((row) => {
        const val = col.accessor(row);
        return val == null ? 0 : String(val).length;
      })
    );
    return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
