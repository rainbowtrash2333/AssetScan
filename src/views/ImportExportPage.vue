<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>导入 / 导出</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>导出设备信息</ion-card-title>
          <ion-card-subtitle>将当前设备列表保存为 Excel 文件</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" color="primary" @click="handleExport" :disabled="exporting">
            <ion-spinner v-if="exporting" slot="start" />
            导出 Excel
          </ion-button>
          <ion-text v-if="exportMessage" color="success" class="ion-margin-top">
            {{ exportMessage }}
          </ion-text>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>导入设备信息</ion-card-title>
          <ion-card-subtitle>选择 Excel 文件并更新设备列表</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" fill="outline" color="primary" @click="triggerFileSelect">
            选择 Excel 文件
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
          <ion-text v-if="errorMessage" color="danger" class="ion-margin-top">
            {{ errorMessage }}
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
import { ref } from 'vue';
import { useDeviceStore } from '@/services/deviceService';
import {
  exportDevicesToExcel,
  importDevicesFromExcel
} from '@/services/excelService';

const { exportAll, mergeBySerial } = useDeviceStore();

const exporting = ref(false);
const exportMessage = ref('');
const importMessage = ref('');
const errorMessage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

const handleExport = async () => {
  exporting.value = true;
  exportMessage.value = '';
  errorMessage.value = '';
  try {
    const fileName = await exportDevicesToExcel(await exportAll());
    exportMessage.value = `Excel 文件已生成：${fileName}`;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '导出失败，请稍后再试。';
    errorMessage.value = message;
  } finally {
    exporting.value = false;
  }
};

const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

const handleImport = async (event: Event) => {
  importMessage.value = '';
  errorMessage.value = '';
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  try {
    const records = await importDevicesFromExcel(file);
    await mergeBySerial(records);
    importMessage.value = `成功导入 ${records.length} 条设备记录。`;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '导入失败，请稍后再试。';
    errorMessage.value = message;
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
