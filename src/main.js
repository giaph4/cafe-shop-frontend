import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import Toast from 'vue-toastification'
import AOS from 'aos'
import { i18n } from './i18n'

import 'element-plus/dist/index.css'
import 'vue-toastification/dist/index.css'
import 'animate.css'
import 'aos/dist/aos.css'
import './assets/styles/design-system.css'
import './assets/styles/enhanced-animations.css'
import './assets/styles/theme.css'
import './assets/styles/element-override.css'
import './assets/styles/animations.css'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(i18n)
app.use(Toast, {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 5,
  newestOnTop: true,
  timeout: 3000
})

app.mount('#app')

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true,
  offset: 100
})