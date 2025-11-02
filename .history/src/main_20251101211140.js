import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Import router
import { createPinia } from 'pinia' // Import pinia
import ElementPlus from 'element-plus' // Import ElementPlus
import 'element-plus/dist/index.css' // CSS cho ElementPlus
import 'bootstrap/dist/css/bootstrap-grid.min.css' // Chỉ import grid system của Bootstrap
import './assets/main.css' // File CSS tùy chỉnh của chúng ta
import Toast from 'vue-toastification' // Import Toast
import 'vue-toastification/dist/index.css' // CSS cho Toast

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) // Sử dụng Pinia
app.use(router) // Sử dụng Vue Router
app.use(ElementPlus) // Sử dụng Element Plus
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 5,
  newestOnTop: true,
  timeout: 3000
})

app.mount('#app')