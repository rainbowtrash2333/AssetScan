<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>{{ t('common.appName') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>{{ t('home.cardSubtitle') }}</ion-card-subtitle>
          <ion-card-title>{{ t('home.cardTitle') }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          {{ t('home.cardDescription') }}
        </ion-card-content>
      </ion-card>

      <ion-item lines="full" class="language-picker">
        <ion-label>{{ t('common.languageLabel') }}</ion-label>
        <ion-select
          interface="popover"
          :value="locale"
          @ionChange="handleLanguageChange"
        >
          <ion-select-option
            v-for="option in languageOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </ion-select-option>
        </ion-select>
      </ion-item>

      <ion-list lines="none">
        <ion-item button detail @click="goTo('/scan')">
          <ion-icon slot="start" :icon="qrCodeOutline" />
          <ion-label>
            <h2>{{ t('home.actions.scan.title') }}</h2>
            <p>{{ t('home.actions.scan.description') }}</p>
          </ion-label>
        </ion-item>

        <ion-item button detail @click="goTo('/devices')">
          <ion-icon slot="start" :icon="listOutline" />
          <ion-label>
            <h2>{{ t('home.actions.devices.title') }}</h2>
            <p>{{ t('home.actions.devices.description') }}</p>
          </ion-label>
        </ion-item>

        <ion-item button detail @click="goTo('/import-export')">
          <ion-icon slot="start" :icon="cloudUploadOutline" />
          <ion-label>
            <h2>{{ t('home.actions.importExport.title') }}</h2>
            <p>{{ t('home.actions.importExport.description') }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { cloudUploadOutline, listOutline, qrCodeOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n, type Locale } from '@/i18n';

const router = useRouter();
const { t, locale, setLocale } = useI18n();

const languageOptions = computed(() => [
  { value: 'en' as Locale, label: t('common.languages.en') },
  { value: 'zh' as Locale, label: t('common.languages.zh') }
]);

const handleLanguageChange = (event: CustomEvent) => {
  const value = (event.detail as { value?: Locale }).value;
  if (value === 'en' || value === 'zh') {
    setLocale(value);
  }
};

const goTo = (target: string) => {
  router.push(target);
};
</script>

<style scoped>
.language-picker {
  margin-bottom: 1.5rem;
}
</style>
