import './assets/styles/variables.css'
import './assets/styles/global.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import './assets/styles/global.css'

createApp(App)
.use(createPinia())
.use(router)
.mount('#app')
