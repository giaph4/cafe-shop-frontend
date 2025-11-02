import { defineStore } from 'pinia'
import apiClient from '@/api/axios'
import router from '@/router'
import { jwtDecode } from 'jwt-decode' // Import thư viện jwt-decode

// Hàm helper để giải mã và trích xuất thông tin user từ token
function decodeToken(token) {
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    // Dựa trên JwtService.java (backend), chúng ta có:
    return {
      userId: decoded.userId,
      username: decoded.sub, // 'sub' (subject) là username
      fullName: decoded.fullName,
      // API của bạn trả về: "authorities": [{"authority": "ROLE_ADMIN"}]
      roles: decoded.authorities.map(auth => auth.authority) // Lấy mảng tên roles
    }
  } catch (error) {
    console.error('Invalid token:', error)
    localStorage.removeItem('token') // Xóa token hỏng
    localStorage.removeItem('user')
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    // Giải mã token (nếu có) khi tải lại trang
    user: decodeToken(localStorage.getItem('token')),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    // Kiểm tra quyền (roles)
    isAdmin: (state) => state.user?.roles?.includes('ROLE_ADMIN'),
    isManager: (state) => state.user?.roles?.includes('ROLE_MANAGER') || state.user?.roles?.includes('ROLE_ADMIN'),
    isStaff: (state) => state.user?.roles?.includes('ROLE_STAFF') || state.user?.roles?.includes('ROLE_MANAGER') || state.user?.roles?.includes('ROLE_ADMIN'),
    
    // Lấy tên người dùng
    userFullName: (state) => state.user?.fullName || state.user?.username || 'User',
  },

  actions: {
    async login(credentials) {
      try {
        // 1. Gọi API login
        const response = await apiClient.post('/api/v1/auth/login', credentials)
        const { token } = response.data 

        // 2. Lưu token vào state và localStorage
        this.token = token
        localStorage.setItem('token', token)

        // 3. Giải mã token để lấy thông tin user
        const userData = decodeToken(token)
        this.user = userData
        localStorage.setItem('user', JSON.stringify(userData)) 

        // 4. Điều hướng đến Dashboard
        router.replace('/')

        return response
      } catch (error) {
        console.error('Login failed:', error)
        this.logout() // Đảm bảo dọn dẹp nếu có lỗi
        throw error
      }
    },

    logout() {
      // Xóa state
      this.token = null
      this.user = null

      // Xóa localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Điều hướng về trang Login
      router.replace('/login')
    },
  }
})