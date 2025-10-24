import jsQR from 'jsqr';

let mediaStream: MediaStream | null = null;
let animationFrameId: number | null = null;
let pendingResolver: ((value: string | null) => void) | null = null;
let currentVideo: HTMLVideoElement | null = null;

const stopAnimation = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const stopTracks = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
};

export const ensureScannerPermission = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前设备不支持摄像头访问');
  }
  try {
    const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
    testStream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
      return false;
    }
    throw error instanceof Error ? error : new Error('无法请求摄像头权限');
  }
};

export const startQrScan = async (videoElement: HTMLVideoElement) => {
  if (!videoElement) {
    throw new Error('摄像头预览未就绪');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前设备不支持摄像头访问');
  }

  await stopScanner();

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 }
      },
      audio: false
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('无法启动摄像头');
  }

  currentVideo = videoElement;
  videoElement.srcObject = mediaStream;
  videoElement.setAttribute('playsinline', 'true');
  videoElement.muted = true;

  try {
    await videoElement.play();
  } catch (error) {
    await stopScanner();
    throw error instanceof Error ? error : new Error('无法启动摄像头预览');
  }

  const canvas = document.createElement('canvas');
  const context =
    canvas.getContext('2d', { willReadFrequently: true } as any) ?? canvas.getContext('2d');

  if (!context) {
    throw new Error('无法初始化扫描上下文');
  }

  return new Promise<string | null>((resolve) => {
    pendingResolver = resolve;

    const scanFrame = () => {
      if (!mediaStream) {
        return;
      }

      if (currentVideo && currentVideo.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = currentVideo?.videoWidth ?? 0;
      canvas.height = currentVideo?.videoHeight ?? 0;

      if (!canvas.width || !canvas.height || !currentVideo) {
        animationFrameId = requestAnimationFrame(scanFrame);
        return;
      }

      context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (qrCode?.data) {
        const trimmed = qrCode.data.trim();
        const resolver = pendingResolver;
        pendingResolver = null;
        resolver?.(trimmed);
        stopScanner();
        return;
      }

      animationFrameId = requestAnimationFrame(scanFrame);
    };

    animationFrameId = requestAnimationFrame(scanFrame);
  });
};

export const stopScanner = async () => {
  stopAnimation();

  if (currentVideo) {
    currentVideo.pause();
    currentVideo.srcObject = null;
    currentVideo = null;
  }

  stopTracks();

  if (pendingResolver) {
    const resolver = pendingResolver;
    pendingResolver = null;
    resolver(null);
  }
};
