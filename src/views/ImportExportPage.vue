<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>{{ t('importExport.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ t('importExport.exportCard.title') }}</ion-card-title>
          <ion-card-subtitle>{{ t('importExport.exportCard.subtitle') }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" color="primary" @click="handleExport" :disabled="exporting">
            <ion-spinner v-if="exporting" slot="start" />
            {{ t('importExport.exportCard.button') }}
          </ion-button>
          <ion-text v-if="exportMessage" color="success" class="ion-margin-top">
            {{ exportMessage }}
          </ion-text>
          <ion-text v-if="errorMessage" color="danger" class="ion-margin-top">
            {{ errorMessage }}
          </ion-text>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ t('importExport.importCard.title') }}</ion-card-title>
          <ion-card-subtitle>{{ t('importExport.importCard.subtitle') }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" fill="outline" color="primary" @click="triggerFileSelect">
            {{ t('importExport.importCard.button') }}
          </ion-button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            class="file-input"
            @change="handleImport"
          />
          <ion-text v-if="importMessage" color="success" class="ion-margin-top">
            {{ importMessage }}
          </ion-text>
          <ion-text v-if="importErrorMessage" color="danger" class="ion-margin-top">
            {{ importErrorMessage }}
          </ion-text>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { useDeviceStore } from '@/services/deviceService';
import {
  exportDevicesToExcel,
  importDevicesFromExcel
} from '@/services/excelService';
import { useI18n } from '@/i18n';

const { exportAll, mergeBySerial } = useDeviceStore();
const { t } = useI18n();

const exporting = ref(false);
const exportMessageKey = ref<string | null>(null);
const exportMessageParams = ref<Record<string, string | number> | undefined>(undefined);
const exportMessage = computed(() =>
  exportMessageKey.value ? t(exportMessageKey.value, exportMessageParams.value) : ''
);
const errorMessageKey = ref<string | null>(null);
const errorMessage = computed(() => (errorMessageKey.value ? t(errorMessageKey.value) : ''));

const importMessageKey = ref<string | null>(null);
const importMessageParams = ref<Record<string, string | number> | undefined>(undefined);
const importMessage = computed(() =>
  importMessageKey.value ? t(importMessageKey.value, importMessageParams.value) : ''
);
const importErrorKey = ref<string | null>(null);
const importErrorMessage = computed(() => (importErrorKey.value ? t(importErrorKey.value) : ''));

const fileInputRef = ref<HTMLInputElement | null>(null);

const handleExport = async () => {
  exporting.value = true;
  exportMessageKey.value = null;
  errorMessageKey.value = null;
  try {
    const fileName = await exportDevicesToExcel(await exportAll());
    exportMessageKey.value = 'importExport.exportCard.success';
    exportMessageParams.value = { file: fileName };
  } catch (error) {
    console.error('[ImportExport] Export failed', error);
    errorMessageKey.value = 'importExport.exportCard.error';
  } finally {
    exporting.value = false;
  }
};

const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

const handleImport = async (event: Event) => {
  importMessageKey.value = null;
  importErrorKey.value = null;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  try {
    const records = await importDevicesFromExcel(file);
    await mergeBySerial(records);
    importMessageKey.value = 'importExport.importCard.success';
    importMessageParams.value = { count: records.length };
  } catch (error) {
    console.error('[ImportExport] Import failed', error);
    importErrorKey.value = 'importExport.importCard.error';
  } finally {
    input.value = '';
  }
};
</script>

<style scoped>
.file-input {
  display: none;
}
</style>
