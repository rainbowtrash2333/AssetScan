export type Locale = 'en' | 'zh';

type MessageTree = { [key: string]: string | MessageTree };

export const messages: Record<Locale, MessageTree> = {
  en: {
    common: {
      appName: 'Asset Scan',
      languageLabel: 'Language',
      languages: {
        en: 'English',
        zh: '中文 (Chinese)'
      }
    },
    home: {
      cardSubtitle: 'Welcome',
      cardTitle: 'Repository Scanner',
      cardDescription:
        'Use the actions below to scan equipment, review inventory, and keep device data synced.',
      actions: {
        scan: {
          title: 'Scan Serial Number',
          description: 'Use the camera to read a QR code and jump to the device list.'
        },
        devices: {
          title: 'Device Inventory',
          description: 'Browse and edit stored device records.'
        },
        importExport: {
          title: 'Import / Export',
          description: 'Sync inventory with Excel spreadsheets.'
        }
      }
    },
    scan: {
      title: 'Scan QR Code',
      instructions: {
        granted: 'Align the QR code within the frame and tap scan to capture the serial number.',
        denied: 'Camera permission is required to scan serial numbers. Enable the camera and retry.'
      },
      buttons: {
        start: 'Start Scan',
        scanning: 'Scanning...',
        viewDevices: 'View Device List'
      },
      prompts: {
        permissionReminder: 'Please grant camera access to scan.'
      },
      errors: {
        permission: 'Camera permission is required to scan.',
        noContent: 'No QR code detected. Please try again.',
        generic: 'Scan failed. Please try again later.'
      }
    },
    deviceList: {
      title: 'Device List',
      searchPlaceholder: 'Enter or paste a serial number',
      searchButton: 'Search',
      importButton: 'Import / Export',
      empty: 'No devices match the current filters.',
      loading: 'Loading device information...',
      serial: 'Serial: {serial}',
      model: 'Model: {model}',
      location: 'Location: {location}',
      updatedAt: 'Updated: {time}',
      status: {
        active: 'Active',
        inactive: 'Inactive',
        maintenance: 'Maintenance',
        retired: 'Retired'
      }
    },
    editDevice: {
      title: 'Edit Device',
      notFound: 'No device record found.',
      fields: {
        serialNumber: 'Serial Number',
        name: 'Device Name',
        model: 'Model',
        status: 'Status',
        location: 'Location',
        notes: 'Notes'
      },
      statusOptions: {
        active: 'Active',
        maintenance: 'Maintenance',
        inactive: 'Inactive',
        retired: 'Retired'
      },
      save: 'Save',
      toast: 'Device information saved'
    },
    importExport: {
      title: 'Import / Export',
      exportCard: {
        title: 'Export Devices',
        subtitle: 'Save the current device list as an Excel file',
        button: 'Export Excel',
        success: 'Excel file generated: {file}',
        error: 'Export failed. Please try again later.'
      },
      importCard: {
        title: 'Import Devices',
        subtitle: 'Select an Excel file to update the device list',
        button: 'Select Excel File',
        success: 'Imported {count} device(s).',
        error: 'Import failed. Please try again later.'
      }
    },
    storage: {
      initFailedTitle: 'Storage Initialization Failed',
      initFailedMessage: 'Unable to connect to the local database. Device data is unavailable.\n\n{detail}',
      alertFallback: 'Unable to connect to the SQLite database.\n{detail}',
      pluginMissing: 'Capacitor SQLite plugin not found. Please ensure it is installed in the native project.',
      createConnectionFailed: 'Unable to create a SQLite connection.',
      dbUnavailable: 'The local database is not initialized or is unavailable.',
      saveUnavailable: 'The local database is unavailable. Unable to save device information.',
      replaceUnavailable: 'The local database is unavailable. Unable to replace device data.',
      mergeUnavailable: 'The local database is unavailable. Unable to merge device data.',
      initUnavailable: 'The local database is not initialized.',
      unknownError: 'Unknown error'
    }
  },
  zh: {
    common: {
      appName: '资产扫码',
      languageLabel: '语言',
      languages: {
        en: 'English 英文',
        zh: '中文'
      }
    },
    home: {
      cardSubtitle: '欢迎',
      cardTitle: '资产仓储扫描',
      cardDescription: '通过下方操作快速扫码、管理库存并保持设备数据同步。',
      actions: {
        scan: {
          title: '扫码序列号',
          description: '使用摄像头识别二维码并跳转至设备列表。'
        },
        devices: {
          title: '设备库存',
          description: '浏览并编辑已存储的设备记录。'
        },
        importExport: {
          title: '导入 / 导出',
          description: '与 Excel 表格同步设备数据。'
        }
      }
    },
    scan: {
      title: '扫码二维码',
      instructions: {
        granted: '对准取景框中的二维码并点击开始扫码以捕获序列号。',
        denied: '需要摄像头权限才能扫码，请在系统设置中启用后重试。'
      },
      buttons: {
        start: '开始扫码',
        scanning: '正在扫描...',
        viewDevices: '查看设备列表'
      },
      prompts: {
        permissionReminder: '请授权摄像头权限以进行扫码操作。'
      },
      errors: {
        permission: '需要摄像头权限才能扫码。',
        noContent: '未捕获到二维码内容，请重新尝试。',
        generic: '扫码失败，请稍后再试。'
      }
    },
    deviceList: {
      title: '设备列表',
      searchPlaceholder: '请输入或粘贴序列号',
      searchButton: '查询',
      importButton: '导入 / 导出',
      empty: '当前条件下没有匹配的设备记录。',
      loading: '正在加载设备信息...',
      serial: '序列号: {serial}',
      model: '型号: {model}',
      location: '位置: {location}',
      updatedAt: '更新时间: {time}',
      status: {
        active: '在用',
        inactive: '闲置',
        maintenance: '维护',
        retired: '退役'
      }
    },
    editDevice: {
      title: '编辑设备',
      notFound: '未找到该设备记录。',
      fields: {
        serialNumber: '序列号',
        name: '设备名称',
        model: '型号',
        status: '状态',
        location: '位置',
        notes: '备注'
      },
      statusOptions: {
        active: '在用',
        maintenance: '维护',
        inactive: '闲置',
        retired: '退役'
      },
      save: '保存',
      toast: '设备信息已保存'
    },
    importExport: {
      title: '导入 / 导出',
      exportCard: {
        title: '导出设备信息',
        subtitle: '将当前设备列表保存为 Excel 文件',
        button: '导出 Excel',
        success: 'Excel 文件已生成：{file}',
        error: '导出失败，请稍后再试。'
      },
      importCard: {
        title: '导入设备信息',
        subtitle: '选择 Excel 文件并更新设备列表',
        button: '选择 Excel 文件',
        success: '成功导入 {count} 条设备记录。',
        error: '导入失败，请稍后再试。'
      }
    },
    storage: {
      initFailedTitle: '存储初始化失败',
      initFailedMessage: '无法连接本地数据库，设备数据暂不可用。\n\n{detail}',
      alertFallback: '无法连接 SQLite 数据库。\n{detail}',
      pluginMissing: '未找到 Capacitor SQLite 插件，请确认已在原生工程中安装。',
      createConnectionFailed: '无法创建 SQLite 连接。',
      dbUnavailable: '本地数据库未初始化或不可用。',
      saveUnavailable: '本地数据库不可用，无法保存设备信息。',
      replaceUnavailable: '本地数据库不可用，无法替换设备数据。',
      mergeUnavailable: '本地数据库不可用，无法合并设备数据。',
      initUnavailable: '本地数据库尚未初始化。',
      unknownError: '未知错误'
    }
  }
};

export const defaultLocale: Locale = 'en';
