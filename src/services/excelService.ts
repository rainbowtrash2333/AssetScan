import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import type { DeviceRecord, DeviceStatus } from './deviceService';
import * as XLSX from 'xlsx';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const toBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    const slice = bytes.subarray(offset, offset + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
};

const normalizeStatus = (value?: string): DeviceStatus => {
  if (!value) {
    return 'inactive';
  }
  const normalized = value.toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'maintenance') return 'maintenance';
  if (normalized === 'retired') return 'retired';
  return 'inactive';
};

export const exportDevicesToExcel = async (
  devices: DeviceRecord[],
  fileName = `devices-${new Date().toISOString().slice(0, 10)}.xlsx`
) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(devices);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');

  const arrayBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  if (Capacitor.getPlatform() === 'web') {
    const blob = new Blob([arrayBuffer], { type: EXCEL_MIME });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return fileName;
  }

  const base64 = toBase64(arrayBuffer);
  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
    recursive: true
  });

  return fileName;
};

interface ExcelRow {
  id?: string;
  serialNumber?: string;
  name?: string;
  model?: string;
  status?: string;
  location?: string;
  notes?: string;
  updatedAt?: string;
}

export const importDevicesFromExcel = async (file: File) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' });
  const records: DeviceRecord[] = rows
    .map((row, index) => {
      const serial = String(row.serialNumber ?? '').trim();
      if (!serial) {
        return null;
      }
      return {
        id: String(row.id ?? ''),
        serialNumber: serial,
        name: String(row.name || `Device ${index + 1}`),
        model: String(row.model ?? ''),
        status: normalizeStatus(String(row.status)),
        location: row.location ? String(row.location) : undefined,
        notes: row.notes ? String(row.notes) : undefined,
        updatedAt: row.updatedAt
          ? new Date(row.updatedAt).toISOString()
          : new Date().toISOString()
      } satisfies DeviceRecord;
    })
    .filter((record): record is DeviceRecord => Boolean(record));
  return records;
};
