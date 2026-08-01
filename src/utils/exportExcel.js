import * as XLSX from 'xlsx';

function getCellValue(row, column) {
  if (column.exportValue) {
    return column.exportValue(row);
  }

  if (column.valueGetter) {
    return column.valueGetter({ row });
  }

  const value = row[column.field];
  if (value === undefined || value === null) {
    return '';
  }

  return value;
}

export function exportToExcel({ rows, columns, filename, sheetName = 'Sheet1' }) {
  const exportColumns = columns.filter((col) => col.field && col.export !== false);

  if (exportColumns.length === 0) {
    throw new Error('No exportable columns found.');
  }

  if (!rows.length) {
    throw new Error('No data available to export.');
  }

  const headers = exportColumns.map((col) => col.headerName || col.field);
  const data = rows.map((row) => exportColumns.map((col) => getCellValue(row, col)));

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}
