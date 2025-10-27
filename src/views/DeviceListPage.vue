<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>{{ t('deviceList.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <ion-searchbar
        :placeholder="t('deviceList.searchPlaceholder')"
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
          {{ t('deviceList.searchButton') }}
        </ion-button>
        <ion-button
          size="small"
          fill="outline"
          color="medium"
          @click="navigateToImport"
        >
          {{ t('deviceList.importButton') }}
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
            <p>{{ t('deviceList.serial', { serial: device.serialNumber }) }}</p>
            <p v-if="device.model">
              {{ t('deviceList.model', { model: device.model }) }}
            </p>
            <p v-if="device.location">
              {{ t('deviceList.location', { location: device.location }) }}
            </p>
            <p class="meta">
              {{ t('deviceList.updatedAt', { time: formatDate(device.updatedAt) }) }}
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
            {{ t('deviceList.empty') }}
          </ion-label>
        </ion-item>
      </ion-list>

      <div v-if="loading" class="loading-state">
        <ion-spinner />
        <p>{{ t('deviceList.loading') }}</p>
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
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DeviceRecord,
  DeviceStatus,
  useDeviceStore
} from '@/services/deviceService';
import { useI18n } from '@/i18n';

const route = useRoute();
const router = useRouter();
const { listBySerial } = useDeviceStore();
const { t, locale } = useI18n();

const searchSerial = ref<string>((route.query.serial as string | undefined) ?? '');
const devices = ref<DeviceRecord[]>([]);
const loading = ref(false);

const formatDate = (value: string) => {
  try {
    const formatter = new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    return formatter.format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
};

const badgeColor = (status: DeviceStatus) => {
  if (status === 'active') return 'success';
  if (status === 'maintenance') return 'warning';
  if (status === 'retired') return 'medium';
  return 'tertiary';
};

const statusLabel = (status: DeviceStatus) => t(`deviceList.status.${status}`);

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
