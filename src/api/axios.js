import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import router from '@/router'

const resolvedBaseUrl = import.meta.env.VITE_API_URL

if (!resolvedBaseUrl && import.meta.env.DEV) {
    console.warn('[axios] VITE_API_URL is not defined. Falling back to http://localhost:8088 for development.')
}

const apiClient = axios.create({
    baseURL: resolvedBaseUrl || 'http://localhost:8088',
    headers: {
        'Content-Type': 'application/json'
    }
})

apiClient.interceptors.request.use(
    (config) => {
        // Phải khởi tạo store BÊN TRONG interceptor
        const authStore = useAuthStore()
        const token = authStore.token

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Chỉ xử lý 401 tại đây
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore()

            if (import.meta.env.DEV) {
                console.warn('[axios] Unauthorized (401) received. Triggering logout sequence.')
            }

            // Kiểm tra xem có phải đang ở trang login không
            // Nếu lỗi 401 mà không phải từ trang login (ví dụ: gõ sai pass)
            // thì mới thực hiện logout
            if (router.currentRoute.value.name !== 'Login') {
                authStore.logout() // Gọi action logout
            }
        }
        return Promise.reject(error)
    }
)

export default apiClient
