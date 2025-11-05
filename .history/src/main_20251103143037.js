import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { store } from './store'; // <- IMPORT STORE GỐC TỪ /src/store/index.js

const app = createApp(App);

app.use(router);
app.use(store); // <- SỬ DỤNG STORE GỐC

app.mount('#app');