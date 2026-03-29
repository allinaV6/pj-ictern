import * as XLSX from 'xlsx';

export type ExcelColumn<T> = {
  header: string;
  key: keyof T | string;
};

export function exportDataToExcel<T>(rows: T[], filename: string, columns: ExcelColumn<T>[]) {
  const sheetData = rows.map((row) => {
    const record: Record<string, unknown> = {};
    columns.forEach((column) => {
      record[column.header] = (row as any)[column.key] ?? '';
    });
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData, {
    header: columns.map((column) => column.header),
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

async function readFileAsBinaryString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
}

export async function parseExcelFile(file: File) {
  const data = await file.arrayBuffer();
  const uint8 = new Uint8Array(data);
  let workbook;

  const tryRead = (value: any, options: XLSX.ParsingOptions) => {
    try {
      return XLSX.read(value, options);
    } catch (err) {
      return null;
    }
  };

  workbook = tryRead(uint8, { type: 'array', cellDates: true, raw: false }) || tryRead(data, { type: 'array', cellDates: true, raw: false });
  if (!workbook) {
    const binary = await readFileAsBinaryString(file);
    workbook = tryRead(binary, { type: 'binary', cellDates: true, raw: false });
  }

  if (!workbook || workbook.SheetNames.length === 0) {
    throw new Error('No sheets found in Excel file');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const sheetData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
  });

  return sheetData.map((row: Record<string, any>) => {
    const normalized: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim();
      normalized[normalizedKey] = value;
    });
    return normalized;
  });
}
