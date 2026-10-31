import { createRouter, createWebHistory } from 'vue-router'
import StatusPage from '../features/status/StatusPage.vue'
import NotFoundPage from '../features/status/NotFoundPage.vue'
export const router = createRouter({ history: createWebHistory(), routes: [
  { path: '/', component: StatusPage },
  { path: '/:pathMatch(.*)*', component: NotFoundPage },
] })
