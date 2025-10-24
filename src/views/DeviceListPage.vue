<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>设备列表</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <ion-searchbar
        placeholder="输入或粘贴 serial number"
        :value="searchSerial"
        debounce="350"
        @ionInput="handleSearchInput"
        @ionClear="resetSearch"
      />

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <div class="toolbar ion-padding-horizontal ion-padding-bottom">
        <ion-button size="small" color="primary" @click="loadDevices">
          查询
        </ion-button>
        <ion-button
          size="small"
          fill="outline"
          color="medium"
          @click="navigateToImport"
        >
          导入 / 导出
        </ion-button>
      </div>

      <ion-list v-if="!loading && devices.length">
        <ion-item
          v-for="device in devices"
          :key="device.id"
          button
          detail
          @click="goToEdit(device.id)"
        >
          <ion-label>
            <h2>{{ device.name }}</h2>
            <p>Serial: {{ device.serialNumber }}</p>
            <p v-if="device.model">型号: {{ device.model }}</p>
            <p v-if="device.location">位置: {{ device.location }}</p>
            <p class="meta">
              更新时间: {{ formatDate(device.updatedAt) }}
            </p>
          </ion-label>
          <ion-badge slot="end" :color="badgeColor(device.status)">
            {{ statusLabel(device.status) }}
          </ion-badge>
        </ion-item>
      </ion-list>

      <ion-list v-else-if="!loading">
        <ion-item lines="none">
          <ion-label class="ion-text-center ion-padding-vertical">
            当前条件下没有匹配的设备记录。
          </ion-label>
        </ion-item>
      </ion-list>

      <div v-if="loading" class="loading-state">
        <ion-spinner />
        <p>正在加载设备信息...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DeviceRecord,
  DeviceStatus,
  useDeviceStore
} from '@/services/deviceService';

const route = useRoute();
const router = useRouter();
const { listBySerial } = useDeviceStore();

const searchSerial = ref<string>(
  (route.query.serial as string | undefined) ?? ''
);
const devices = ref<DeviceRecord[]>([]);
const loading = ref(false);

const loadDevices = async () => {
  loading.value = true;
  try {
    devices.value = await listBySerial(searchSerial.value);
  } finally {
    loading.value = false;
  }
};

const goToEdit = (deviceId: string) => {
  router.push({ name: 'DeviceEdit', params: { id: deviceId } });
};

const navigateToImport = () => {
  router.push({ name: 'ImportExport' });
};

const handleSearchInput = (event: CustomEvent) => {
  const value = (event.detail as { value?: string }).value ?? '';
  searchSerial.value = value;
  loadDevices();
};

const resetSearch = () => {
  searchSerial.value = '';
  loadDevices();
};

const handleRefresh = async (event: CustomEvent) => {
  await loadDevices();
  (event.target as HTMLIonRefresherElement).complete();
};

const badgeColor = (status: DeviceStatus) => {
  if (status === 'active') return 'success';
  if (status === 'maintenance') return 'warning';
  if (status === 'retired') return 'medium';
  return 'tertiary';
};

const statusLabel = (status: DeviceStatus) => {
  if (status === 'active') return '在用';
  if (status === 'maintenance') return '维护';
  if (status === 'retired') return '退役';
  return '闲置';
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleString();
};

watch(
  () => route.query.serial,
  (serial) => {
    searchSerial.value = (serial as string | undefined) ?? '';
    loadDevices();
  }
);

loadDevices();
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-start;
}

.loading-state {
  margin-top: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-medium);
}

.meta {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}
</style>
