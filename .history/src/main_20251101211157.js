import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia' 
import ElementPlus from 'element-plus' 
import 'element-plus/dist/index.css' 
import 'bootstrap/dist/css/bootstrap-grid.min.css' 
import './assets/main.css'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) 
app.use(router) 
app.use(ElementPlus) 
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 5,
  newestOnTop: true,
  timeout: 3000
})

app.mount('#app')