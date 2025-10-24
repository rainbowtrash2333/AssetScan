<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>扫码二维码</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding">
      <section class="scanner-preview" :class="{ 'scanner-preview--active': isScanning }">
        <div class="scanner-frame">
          <video
            ref="videoRef"
            class="scanner-video"
            autoplay
            playsinline
            muted
          ></video>
          <ion-icon v-if="!isScanning" :icon="scanOutline" />
        </div>
        <p v-if="permissionGranted">
          对准二维码并保持稳定，系统会自动识别设备序列号。
        </p>
        <p v-else>
          需要摄像头权限才能扫码，请在系统设置中启用后重试。
        </p>
      </section>

      <ion-button
        expand="block"
        color="primary"
        @click="handleScan"
        :disabled="isScanning"
      >
        <ion-spinner v-if="isScanning" slot="start" />
        <span v-if="isScanning">正在扫描...</span>
        <span v-else>开始扫码</span>
      </ion-button>

      <ion-button
        expand="block"
        fill="outline"
        color="medium"
        class="ion-margin-top"
        @click="navigateToDevices"
      >
        查看设备列表
      </ion-button>

      <ion-text color="danger" v-if="errorMessage" class="ion-margin-top">
        {{ errorMessage }}
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { scanOutline } from 'ionicons/icons';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ensureScannerPermission,
  startQrScan,
  stopScanner
} from '@/services/qrScannerService';

const router = useRouter();
const videoRef = ref<HTMLVideoElement | null>(null);
const isScanning = ref(false);
const permissionGranted = ref(false);
const errorMessage = ref('');

const handleScan = async () => {
  errorMessage.value = '';

  if (!videoRef.value) {
    errorMessage.value = '摄像头预览尚未就绪，请稍后重试。';
    return;
  }

  if (!permissionGranted.value) {
    try {
      permissionGranted.value = await ensureScannerPermission();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '无法获取摄像头权限。';
      errorMessage.value = message;
      return;
    }

    if (!permissionGranted.value) {
      errorMessage.value = '请在系统设置中授予摄像头权限。';
      return;
    }
  }

  try {
    isScanning.value = true;
    const serial = await startQrScan(videoRef.value);
    if (!serial) {
      errorMessage.value = '未捕获到二维码内容，请重新尝试。';
      return;
    }
    router.replace({ name: 'Devices', query: { serial } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '扫码失败，请稍后再试。';
    errorMessage.value = message;
  } finally {
    isScanning.value = false;
    await stopScanner();
  }
};

const navigateToDevices = () => {
  router.push({ name: 'Devices' });
};

onMounted(async () => {
  try {
    permissionGranted.value = await ensureScannerPermission();
    if (!permissionGranted.value) {
      errorMessage.value = '请授权摄像头权限以进行扫码操作。';
    }
  } catch (error) {
    permissionGranted.value = false;
    const message =
      error instanceof Error ? error.message : '无法获取摄像头权限。';
    errorMessage.value = message;
  }
});

onBeforeUnmount(async () => {
  await stopScanner();
});
</script>

<style scoped>
.scanner-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  border: 2px dashed var(--ion-color-medium);
  border-radius: 16px;
  transition: border-color 0.3s ease;
  margin-bottom: 1.5rem;
  text-align: center;
}

.scanner-preview--active {
  border-color: var(--ion-color-primary);
}

.scanner-frame {
  position: relative;
  width: min(100%, 320px);
  aspect-ratio: 1 / 1;
  margin-bottom: 1rem;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.scanner-frame ion-icon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 4rem;
  color: var(--ion-color-primary);
  background: rgba(0, 0, 0, 0.35);
}
</style>
