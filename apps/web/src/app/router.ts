import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../features/home/HomePage.vue'
import { sections } from './sections'
export const router = createRouter({ history: createWebHistory(), scrollBehavior: () => ({ top: 0 }), routes: [
  { path: '/', component: HomePage },
  ...sections.filter(section => section.path !== '/').map(section => ({ path: section.path, component: () => import('../features/shell/SectionPage.vue') })),
  { path: '/system', component: () => import('../features/status/StatusPage.vue') },
  { path: '/design-system', component: () => import('../features/design/DesignSystemPage.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('../features/status/NotFoundPage.vue') },
] })
