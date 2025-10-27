<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/devices" />
        </ion-buttons>
        <ion-title>{{ t('editDevice.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <ion-list lines="full" v-if="!notFound">
        <ion-item>
          <ion-label position="stacked">{{ t('editDevice.fields.serialNumber') }}</ion-label>
          <ion-input :value="form.serialNumber" readonly />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">{{ t('editDevice.fields.name') }}</ion-label>
          <ion-input v-model="form.name" required />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">{{ t('editDevice.fields.model') }}</ion-label>
          <ion-input v-model="form.model" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">{{ t('editDevice.fields.status') }}</ion-label>
          <ion-select v-model="form.status" interface="popover">
            <ion-select-option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">{{ t('editDevice.fields.location') }}</ion-label>
          <ion-input v-model="form.location" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">{{ t('editDevice.fields.notes') }}</ion-label>
          <ion-textarea v-model="form.notes" auto-grow />
        </ion-item>
      </ion-list>

      <ion-list v-else lines="none">
        <ion-item>
          <ion-label class="ion-text-center ion-padding-vertical">
            {{ t('editDevice.notFound') }}
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>

    <ion-footer v-if="!notFound">
      <ion-toolbar>
        <ion-button
          expand="block"
          color="primary"
          @click="handleSubmit"
          :disabled="saving"
        >
          <ion-spinner slot="start" v-if="saving" />
          {{ t('editDevice.save') }}
        </ion-button>
      </ion-toolbar>
    </ion-footer>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      position="bottom"
      :duration="1800"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar
} from '@ionic/vue';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DeviceRecord,
  DeviceStatus,
  useDeviceStore
} from '@/services/deviceService';
import { useI18n } from '@/i18n';

const route = useRoute();
const router = useRouter();
const { getById, save } = useDeviceStore();
const { t } = useI18n();

const statusOptions = computed(() => [
  { value: 'active' as DeviceStatus, label: t('editDevice.statusOptions.active') },
  { value: 'maintenance' as DeviceStatus, label: t('editDevice.statusOptions.maintenance') },
  { value: 'inactive' as DeviceStatus, label: t('editDevice.statusOptions.inactive') },
  { value: 'retired' as DeviceStatus, label: t('editDevice.statusOptions.retired') }
]);

const deviceId = route.params.id as string | undefined;
const notFound = ref(false);
const saving = ref(false);
const toastOpen = ref(false);
const toastKey = ref<string | null>(null);

const toastMessage = computed(() => (toastKey.value ? t(toastKey.value) : ''));

const form = reactive<Omit<DeviceRecord, 'id' | 'updatedAt'>>({
  serialNumber: '',
  name: '',
  model: '',
  status: 'inactive',
  location: '',
  notes: ''
});

const loadDevice = async () => {
  if (!deviceId) {
    notFound.value = true;
    return;
  }
  const record = await getById(deviceId);
  if (!record) {
    notFound.value = true;
    return;
  }
  notFound.value = false;
  form.serialNumber = record.serialNumber;
  form.name = record.name;
  form.model = record.model;
  form.status = record.status as DeviceStatus;
  form.location = record.location ?? '';
  form.notes = record.notes ?? '';
};

const handleSubmit = async () => {
  if (notFound.value || !deviceId) {
    return;
  }
  saving.value = true;
  try {
    await save({
      id: deviceId,
      serialNumber: form.serialNumber,
      name: form.name,
      model: form.model,
      status: form.status,
      location: form.location || undefined,
      notes: form.notes || undefined,
      updatedAt: new Date().toISOString()
    });
    toastKey.value = 'editDevice.toast';
    toastOpen.value = true;
    setTimeout(() => {
      router.replace({
        name: 'Devices',
        query: { serial: form.serialNumber }
      });
    }, 400);
  } finally {
    saving.value = false;
  }
};

void loadDevice();
</script>
