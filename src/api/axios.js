import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import router from '@/router' // Import router để xử lý 401

const apiClient = axios.create({
    baseURL: 'http://localhost:8088', // URL backend của bạn
    headers: {
        'Content-Type': 'application/json'
    }
})

// --- Request Interceptor ---
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

// --- Response Interceptor ---
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Chỉ xử lý 401 tại đây
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore()
            console.error('Unauthorized (401)! Token expired or invalid. Logging out.')

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