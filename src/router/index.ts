import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import ScanPage from '../views/ScanPage.vue';
import DeviceListPage from '../views/DeviceListPage.vue';
import EditDevicePage from '../views/EditDevicePage.vue';
import ImportExportPage from '../views/ImportExportPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/scan',
    name: 'Scan',
    component: ScanPage
  },
  {
    path: '/devices',
    name: 'Devices',
    component: DeviceListPage
  },
  {
    path: '/devices/:id/edit',
    name: 'DeviceEdit',
    component: EditDevicePage,
    props: true
  },
  {
    path: '/import-export',
    name: 'ImportExport',
    component: ImportExportPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
