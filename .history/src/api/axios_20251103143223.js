import axios from 'axios';
import { store } from '@/store'; // Import store GỐC

// Lấy VITE_API_URL từ biến môi trường .env
const VITE_API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: VITE_API_URL ? `${VITE_API_URL}/api` : 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để tự động thêm token vào MỌI request
api.interceptors.request.use(
    (config) => {
        // Lấy token từ state của auth module trong store GỐC
        const token = store.state.auth.token;

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;