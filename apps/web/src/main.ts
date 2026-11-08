import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './app/router'
import './style.css'
const app = createApp(App).use(createPinia()).use(router)
void router.isReady().then(() => app.mount('#app'))
