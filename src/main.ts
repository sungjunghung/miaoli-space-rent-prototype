import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { installAssetCssVariables } from './utils/assets'

installAssetCssVariables()

createApp(App).use(createPinia()).use(router).mount('#app')
