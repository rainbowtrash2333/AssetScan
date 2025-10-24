import { computed, ref } from 'vue';

export type DeviceStatus = 'active' | 'inactive' | 'maintenance' | 'retired';

export interface DeviceRecord {
  id: string;
  serialNumber: string;
  name: string;
  model: string;
  status: DeviceStatus;
  location?: string;
  notes?: string;
  updatedAt: string;
}

const seedDevices: DeviceRecord[] = [
  {
    id: 'dev-1001',
    serialNumber: 'SN-AX-202401',
    name: 'Thermal Scanner',
    model: 'TS-200',
    status: 'active',
    location: 'Warehouse A',
    notes: 'Calibrated last week',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dev-1002',
    serialNumber: 'SN-AX-202402',
    name: 'Barcode Handheld',
    model: 'BHX-10',
    status: 'maintenance',
    location: 'Repair Bench',
    notes: 'Battery replacement pending',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dev-1003',
    serialNumber: 'SN-AX-202403',
    name: 'Asset Tracker',
    model: 'AT-4G',
    status: 'inactive',
    location: 'Warehouse B',
    notes: 'Awaiting redeployment',
    updatedAt: new Date().toISOString()
  }
];

const deviceStore = ref<DeviceRecord[]>([...seedDevices]);

const ensureId = (record: DeviceRecord): DeviceRecord => {
  if (!record.id) {
    const generatedId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `dev-${Date.now()}`;
    return { ...record, id: generatedId };
  }
  return record;
};

export const useDeviceStore = () => {
  const devices = computed(() => deviceStore.value);

  const listBySerial = async (serial?: string) => {
    if (!serial) {
      return [...deviceStore.value];
    }
    const normalized = serial.trim().toLowerCase();
    return deviceStore.value.filter((device) =>
      device.serialNumber.toLowerCase().includes(normalized)
    );
  };

  const getById = (id: string) => {
    return deviceStore.value.find((device) => device.id === id) ?? null;
  };

  const save = async (payload: DeviceRecord) => {
    const next = { ...ensureId(payload), updatedAt: new Date().toISOString() };
    const index = deviceStore.value.findIndex((item) => item.id === next.id);
    if (index >= 0) {
      deviceStore.value.splice(index, 1, next);
    } else {
      deviceStore.value.push(next);
    }
    deviceStore.value = [...deviceStore.value];
    return next;
  };

  const replaceAll = (records: DeviceRecord[]) => {
    const prepared = records.map((record) => ({
      ...ensureId(record),
      updatedAt: record.updatedAt ?? new Date().toISOString()
    }));
    deviceStore.value = prepared;
  };

  const mergeBySerial = (records: DeviceRecord[]) => {
    const lookup = new Map(deviceStore.value.map((device) => [device.serialNumber, device]));
    records.forEach((record) => {
      const normalized = { ...ensureId(record) };
      normalized.updatedAt = record.updatedAt ?? new Date().toISOString();
      lookup.set(normalized.serialNumber, normalized);
    });
    deviceStore.value = Array.from(lookup.values());
  };

  const exportAll = () => {
    return [...deviceStore.value];
  };

  return {
    devices,
    listBySerial,
    getById,
    save,
    replaceAll,
    mergeBySerial,
    exportAll
  };
};
