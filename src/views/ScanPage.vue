<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>{{ t('scan.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding">
      <section class="scanner-preview" :class="{ 'scanner-preview--active': isScanning }">
        <div class="scanner-frame">
          <ion-icon :icon="scanOutline" />
        </div>
        <p>{{ instructions }}</p>
      </section>

      <ion-button
        expand="block"
        color="primary"
        @click="handleScan"
        :disabled="isScanning"
      >
        <ion-spinner v-if="isScanning" slot="start" />
        <span>{{ startButtonLabel }}</span>
      </ion-button>

      <ion-button
        expand="block"
        fill="outline"
        color="medium"
        class="ion-margin-top"
        @click="navigateToDevices"
      >
        {{ t('scan.buttons.viewDevices') }}
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ensureScannerPermission,
  startQrScan,
  stopScanner
} from '@/services/qrScannerService';
import { useI18n } from '@/i18n';

const router = useRouter();
const { t } = useI18n();

const isScanning = ref(false);
const permissionGranted = ref(false);
const errorKey = ref<string | null>(null);
const errorParams = ref<Record<string, string | number> | undefined>(undefined);

const errorMessage = computed(() => (errorKey.value ? t(errorKey.value, errorParams.value) : ''));
const instructions = computed(() =>
  permissionGranted.value ? t('scan.instructions.granted') : t('scan.instructions.denied')
);
const startButtonLabel = computed(() =>
  isScanning.value ? t('scan.buttons.scanning') : t('scan.buttons.start')
);

const setError = (key: string | null, params?: Record<string, string | number>) => {
  errorKey.value = key;
  errorParams.value = params;
};

const handleScan = async () => {
  setError(null);

  if (!permissionGranted.value) {
    try {
      permissionGranted.value = await ensureScannerPermission();
    } catch (error) {
      console.error('[ScanPage] Permission request failed', error);
      setError('scan.errors.generic');
      return;
    }

    if (!permissionGranted.value) {
      setError('scan.errors.permission');
      return;
    }
  }

  try {
    isScanning.value = true;
    const serial = await startQrScan();
    if (!serial) {
      setError('scan.errors.noContent');
      return;
    }
    router.replace({ name: 'Devices', query: { serial } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'camera-permission-denied') {
      setError('scan.errors.permission');
    } else {
      setError('scan.errors.generic');
    }
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
      setError('scan.prompts.permissionReminder');
    }
  } catch (error) {
    console.error('[ScanPage] Initialization failed', error);
    permissionGranted.value = false;
    setError('scan.errors.generic');
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

.scanner-frame ion-icon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 4rem;
  color: var(--ion-color-primary);
  background: rgba(0, 0, 0, 0.35);
}

:global(body.scanner-active) {
  background: transparent !important;
}
</style>
