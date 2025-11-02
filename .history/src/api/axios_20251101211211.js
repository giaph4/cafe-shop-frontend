import axios from 'axios'
import { useAuthStore } from '@/store/auth' // Import Pinia store (chúng ta sẽ tạo ngay sau đây)

const apiClient = axios.create({
  baseURL: 'http://localhost:8088', // URL backend của bạn
  headers: {
    'Content-Type': 'application/json'
  }
})

// --- Request Interceptor ---
// Tự động thêm token vào header trước MỖI request
apiClient.interceptors.request.use(
  (config) => {
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
// Xử lý lỗi tập trung, đặc biệt là lỗi 401 (Unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    // Mọi status code 2xx sẽ đi qua đây
    return response
  },
  (error) => {
    // Mọi status code ngoài 2xx sẽ đi qua đây
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      // Token hết hạn hoặc không hợp lệ
      console.error('Unauthorized! Logging out.')
      authStore.logout() // Gọi action logout từ Pinia store
      
      // Chuyển hướng về trang login
      // Chúng ta dùng router.push() trong file router, ở đây chỉ cần gọi logout
    }
    return Promise.reject(error)
  }
)

export default apiClient