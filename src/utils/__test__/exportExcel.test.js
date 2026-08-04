import * as XLSX from 'xlsx';
import { exportToExcel } from '../exportExcel';

jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

describe('exportToExcel', () => {
  const columns = [
    { field: 'name', headerName: 'Name' },
    { field: 'status', headerName: 'Status', export: false },
  ];
  const rows = [{ id: 1, name: 'Item A', status: 'active' }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports rows using exportable columns', () => {
    exportToExcel({ rows, columns, filename: 'report' });
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ['Name'],
      ['Item A'],
    ]);
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'report.xlsx');
  });

  it('throws when no exportable columns exist', () => {
    expect(() =>
      exportToExcel({ rows, columns: [{ field: 'x', export: false }], filename: 'report' })
    ).toThrow('No exportable columns found.');
  });

  it('throws when rows are empty', () => {
    expect(() => exportToExcel({ rows: [], columns, filename: 'report' })).toThrow(
      'No data available to export.'
    );
  });
});
