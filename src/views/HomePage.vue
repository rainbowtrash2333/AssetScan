<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Asset Scan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Welcome</ion-card-subtitle>
          <ion-card-title>Repository Scanner</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          Use the actions below to scan equipment, review inventory, and keep device data synced.
        </ion-card-content>
      </ion-card>

      <ion-list lines="none">
        <ion-item button detail @click="goTo('/scan')">
          <ion-icon slot="start" :icon="qrCodeOutline" />
          <ion-label>
            <h2>Scan Serial Number</h2>
            <p>Use the camera to read a QR code and jump to the device list.</p>
          </ion-label>
        </ion-item>

        <ion-item button detail @click="goTo('/devices')">
          <ion-icon slot="start" :icon="listOutline" />
          <ion-label>
            <h2>Device Inventory</h2>
            <p>Browse and edit stored device records.</p>
          </ion-label>
        </ion-item>

        <ion-item button detail @click="goTo('/import-export')">
          <ion-icon slot="start" :icon="cloudUploadOutline" />
          <ion-label>
            <h2>Import / Export</h2>
            <p>Sync inventory with Excel spreadsheets.</p>
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
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { cloudUploadOutline, listOutline, qrCodeOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const router = useRouter();

const goTo = (target: string) => {
  router.push(target);
};
</script>
