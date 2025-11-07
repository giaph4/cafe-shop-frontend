// src/store/index.js
import { createStore } from 'vuex';
import { authModule } from './authModule';
import { posModule } from './posModule';

// Đây là store gốc duy nhất của ứng dụng
export const store = createStore({
    modules: {
        auth: authModule,
        pos: posModule,
    },
});
