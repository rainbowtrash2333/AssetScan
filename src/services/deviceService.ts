import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Dialog } from '@capacitor/dialog';
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

const DB_NAME = 'asset_scan';
const DB_VERSION = 1;
const TABLE_NAME = 'devices';

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

const devicesRef = ref<DeviceRecord[]>([]);

let sqlite: SQLiteConnection | null = null;
let database: SQLiteDBConnection | null = null;
let initializing: Promise<void> | null = null;
let initError: Error | null = null;
let initAlertPresented = false;

const ensureId = (record: DeviceRecord): DeviceRecord => {
  if (record.id) {
    return record;
  }
  const generatedId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `dev-${Date.now()}`;
  return { ...record, id: generatedId };
};

const coerceStatus = (value: unknown): DeviceStatus => {
  if (value === 'active' || value === 'inactive' || value === 'maintenance' || value === 'retired') {
    return value;
  }
  return 'inactive';
};

const mapRowToRecord = (row: Record<string, unknown>): DeviceRecord => {
  return {
    id: String(row.id ?? ''),
    serialNumber: String(row.serialNumber ?? ''),
    name: String(row.name ?? ''),
    model: String(row.model ?? ''),
    status: coerceStatus(row.status),
    location: row.location !== null && row.location !== undefined ? String(row.location) : undefined,
    notes: row.notes !== null && row.notes !== undefined ? String(row.notes) : undefined,
    updatedAt: String(row.updatedAt ?? new Date().toISOString())
  };
};

const toRecords = (rows?: Array<Record<string, unknown>>): DeviceRecord[] => {
  if (!rows?.length) {
    return [];
  }
  return rows.map(mapRowToRecord);
};

const getCountFromQuery = (rows?: Array<Record<string, unknown>>): number => {
  if (!rows?.length) {
    return 0;
  }
  const raw = rows[0].count ?? rows[0]['COUNT(*)'];
  return Number(raw ?? 0);
};

const presentInitError = async (error: unknown) => {
  if (initAlertPresented) {
    return;
  }
  initAlertPresented = true;
  const message =
    error instanceof Error
      ? `${error.message}`
      : '无法初始化本地数据库，请检查插件是否已正确安装。';

  try {
    await Dialog.alert({
      title: '存储初始化失败',
      message: `无法连接 SQLite 数据库，设备数据不可用。\n\n${message}`
    });
  } catch {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`无法连接 SQLite 数据库。\n${message}`);
    } else {
      console.error('[deviceService] SQLite initialization failed:', message);
    }
  }
};

const openSQLiteConnection = async () => {
  const plugin: any = CapacitorSQLite;
  if (!plugin) {
    throw new Error('CapacitorSQLite 插件未找到，请确认原生工程已安装。');
  }
  sqlite = sqlite ?? new SQLiteConnection(plugin);
  const connection = await sqlite.createConnection(
    DB_NAME,
    false,
    'no-encryption',
    DB_VERSION,
    false
  );
  if (!connection) {
    throw new Error('无法创建 SQLite 连接。');
  }
  await connection.open();
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY NOT NULL,
      serialNumber TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      model TEXT,
      status TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      updatedAt TEXT NOT NULL
    );
  `);
  await connection.execute(`
    CREATE INDEX IF NOT EXISTS idx_devices_serial ON ${TABLE_NAME}(serialNumber);
  `);
  const existing = await connection.query(`SELECT COUNT(*) AS count FROM ${TABLE_NAME};`);
  if (getCountFromQuery(existing.values) === 0) {
    const insertStatement = `
      INSERT INTO ${TABLE_NAME} (id, serialNumber, name, model, status, location, notes, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    for (const record of seedDevices) {
      const payload = ensureId(record);
      await connection.run(insertStatement, [
        payload.id,
        payload.serialNumber,
        payload.name,
        payload.model,
        payload.status,
        payload.location ?? null,
        payload.notes ?? null,
        payload.updatedAt
      ]);
    }
  }
  database = connection;
};

const refreshCache = async () => {
  if (!database) {
    devicesRef.value = [];
    return;
  }
  const result = await database.query(
    `SELECT * FROM ${TABLE_NAME} ORDER BY datetime(updatedAt) DESC;`
  );
  devicesRef.value = toRecords(result.values);
};

const runInitialization = async () => {
  try {
    await openSQLiteConnection();
    await refreshCache();
  } catch (error) {
    database = null;
    if (sqlite) {
      try {
        await sqlite.closeConnection(DB_NAME, false);
      } catch {
        // noop
      }
    }
    sqlite = null;
    initError = error instanceof Error ? error : new Error(String(error));
    await presentInitError(initError);
    throw initError;
  }
};

const ensureInitialized = async () => {
  if (database) {
    return true;
  }
  if (!initializing) {
    initAlertPresented = false;
    initError = null;
    initializing = runInitialization();
  }
  try {
    await initializing;
    return true;
  } catch {
    return false;
  } finally {
    initializing = null;
  }
};

const requireDatabase = () => {
  if (!database) {
    throw initError ?? new Error('本地数据库未初始化或不可用。');
  }
  return database;
};

const runSqliteUpsert = async (
  record: DeviceRecord,
  conflictKey: 'id' | 'serialNumber' = 'id'
) => {
  const conn = requireDatabase();
  const params = [
    record.id,
    record.serialNumber,
    record.name,
    record.model,
    record.status,
    record.location ?? null,
    record.notes ?? null,
    record.updatedAt
  ];

  if (conflictKey === 'serialNumber') {
    await conn.run(
      `
        INSERT INTO ${TABLE_NAME} (id, serialNumber, name, model, status, location, notes, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(serialNumber) DO UPDATE SET
          id = excluded.id,
          name = excluded.name,
          model = excluded.model,
          status = excluded.status,
          location = excluded.location,
          notes = excluded.notes,
          updatedAt = excluded.updatedAt;
      `,
      params
    );
    return;
  }

  await conn.run(
    `
      INSERT INTO ${TABLE_NAME} (id, serialNumber, name, model, status, location, notes, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        serialNumber = excluded.serialNumber,
        name = excluded.name,
        model = excluded.model,
        status = excluded.status,
        location = excluded.location,
        notes = excluded.notes,
        updatedAt = excluded.updatedAt;
    `,
    params
  );
};

const insertOrUpdate = async (
  payload: DeviceRecord,
  conflictKey: 'id' | 'serialNumber' = 'id'
) => {
  const next = {
    ...ensureId(payload),
    updatedAt: payload.updatedAt ?? new Date().toISOString()
  };
  await runSqliteUpsert(next, conflictKey);
  return next;
};

const safeEnsure = async () => {
  const ready = await ensureInitialized();
  return ready;
};

export const useDeviceStore = () => {
  const devices = computed(() => devicesRef.value);

  const listBySerial = async (serial?: string) => {
    const ready = await safeEnsure();
    if (!ready) {
      return [];
    }
    const conn = requireDatabase();
    if (!serial) {
      await refreshCache();
      return [...devicesRef.value];
    }
    const normalized = serial.trim().toLowerCase();
    const result = await conn.query(
      `
        SELECT * FROM ${TABLE_NAME}
        WHERE LOWER(serialNumber) LIKE ?
        ORDER BY datetime(updatedAt) DESC;
      `,
      [`%${normalized}%`]
    );
    return toRecords(result.values);
  };

  const getById = async (id: string) => {
    const ready = await safeEnsure();
    if (!ready) {
      return null;
    }
    const conn = requireDatabase();
    const result = await conn.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ? LIMIT 1;`,
      [id]
    );
    const records = toRecords(result.values);
    return records.length ? records[0] : null;
  };

  const save = async (payload: DeviceRecord) => {
    const ready = await safeEnsure();
    if (!ready) {
      throw initError ?? new Error('本地数据库不可用，无法保存设备信息。');
    }
    const next = await insertOrUpdate(
      {
        ...payload,
        updatedAt: new Date().toISOString()
      },
      'id'
    );
    await refreshCache();
    return next;
  };

  const replaceAll = async (records: DeviceRecord[]) => {
    const ready = await safeEnsure();
    if (!ready) {
      throw initError ?? new Error('本地数据库不可用，无法替换设备数据。');
    }
    const conn = requireDatabase();
    await conn.execute('BEGIN IMMEDIATE;');
    try {
      await conn.run(`DELETE FROM ${TABLE_NAME};`);
      for (const record of records) {
        await runSqliteUpsert(
          {
            ...record,
            updatedAt: record.updatedAt ?? new Date().toISOString()
          },
          'id'
        );
      }
      await conn.execute('COMMIT;');
    } catch (error) {
      await conn.execute('ROLLBACK;');
      throw error;
    }
    await refreshCache();
  };

  const mergeBySerial = async (records: DeviceRecord[]) => {
    const ready = await safeEnsure();
    if (!ready) {
      throw initError ?? new Error('本地数据库不可用，无法合并设备数据。');
    }
    const conn = requireDatabase();
    await conn.execute('BEGIN IMMEDIATE;');
    try {
      for (const record of records) {
        await runSqliteUpsert(
          {
            ...record,
            updatedAt: record.updatedAt ?? new Date().toISOString()
          },
          'serialNumber'
        );
      }
      await conn.execute('COMMIT;');
    } catch (error) {
      await conn.execute('ROLLBACK;');
      throw error;
    }
    await refreshCache();
  };

  const exportAll = async () => {
    const ready = await safeEnsure();
    if (!ready) {
      return [];
    }
    const conn = requireDatabase();
    const result = await conn.query(
      `SELECT * FROM ${TABLE_NAME} ORDER BY datetime(updatedAt) DESC;`
    );
    return toRecords(result.values);
  };

  const ready = async () => {
    const success = await safeEnsure();
    if (!success) {
      throw initError ?? new Error('本地数据库未初始化。');
    }
  };

  return {
    devices,
    listBySerial,
    getById,
    save,
    replaceAll,
    mergeBySerial,
    exportAll,
    ready
  };
};

void ensureInitialized();
