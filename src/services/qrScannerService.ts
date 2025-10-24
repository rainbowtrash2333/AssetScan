import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHint
} from '@capacitor/barcode-scanner';
import { Capacitor } from '@capacitor/core';

type PermissionPlugin = {
  checkPermissions?: () => Promise<{ camera?: string | null }>;
  requestPermissions?: (options?: { allowWithoutCamera?: boolean }) => Promise<{ camera?: string | null }>;
};

type CameraPermission = string | null | undefined;

const pluginWithPermissions = CapacitorBarcodeScanner as unknown as PermissionPlugin;

const isGranted = (camera: CameraPermission) => camera === 'granted' || camera === 'limited';

const requestWebPermission = async () => {
  if (!navigator?.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
      return false;
    }
    throw error instanceof Error ? error : new Error('无法请求摄像头权限');
  }
};

export const ensureScannerPermission = async () => {
  if (pluginWithPermissions.checkPermissions) {
    const status = await pluginWithPermissions.checkPermissions();
    if (isGranted(status?.camera ?? undefined)) {
      return true;
    }
  }

  if (pluginWithPermissions.requestPermissions) {
    const requested = await pluginWithPermissions.requestPermissions({ allowWithoutCamera: false });
    if (isGranted(requested?.camera ?? undefined)) {
      return true;
    }
  }

  if (Capacitor.getPlatform() === 'web') {
    return requestWebPermission();
  }

  return true;
};

const setBodyScanningState = (active: boolean) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.toggle('scanner-active', active);
};

export const startQrScan = async () => {
  const granted = await ensureScannerPermission();
  if (!granted) {
    throw new Error('摄像头权限未授予');
  }

  setBodyScanningState(true);

  try {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
      scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
      scanInstructions: ' ',
      scanButton: false,
      scanText: ' '
    });
    return result?.ScanResult?.trim() ?? null;
  } finally {
    setBodyScanningState(false);
  }
};

export const stopScanner = async () => {
  setBodyScanningState(false);
};
