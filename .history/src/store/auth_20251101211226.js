
import { defineStore } from 'pinia'
import apiClient from '@/api/axios'
import router from '@/router' // Import router để điều hướng

export const useAuthStore = defineStore('auth', {
  // State: Lưu token và user từ localStorage (nếu có)
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),

  // Getters: các state tính toán (ví dụ: kiểm tra đã đăng nhập chưa)
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.roles?.some(role => role.name === 'ROLE_ADMIN'),
    isManager: (state) => state.user?.roles?.some(role => role.name === 'ROLE_MANAGER' || role.name === 'ROLE_ADMIN'),
    // (Bạn có thể thêm các getter khác cho STAFF)
  },

  // Actions: các hàm xử lý logic (login, logout, lấy thông tin user)
  actions: {
    async login(credentials) {
      try {
        // 1. Gọi API login
        const response = await apiClient.post('/api/v1/auth/login', credentials)
        const { token, username } = response.data

        // 2. Lưu token
        this.token = token
        localStorage.setItem('token', token)

        // 3. Lấy thông tin user (API này chúng ta sẽ cần thêm ở backend hoặc dùng API /api/v1/users/{username})
        // Giả sử API /api/v1/users/profile (lấy user_id từ token) là API lấy thông tin user
        // Tạm thời, chúng ta sẽ gọi 1 API khác (ví dụ: /api/v1/users/username/{username})
        // (Nếu backend trả về đủ info user khi login thì bỏ qua bước này)
        
        // Giả lập lấy thông tin user (Backend của bạn cần 1 API để lấy info user bằng username)
        // Giả sử chúng ta có API: GET /api/v1/users/username/{username} (Bạn cần thêm API này)
        // const userResponse = await apiClient.get(`/api/v1/users/username/${username}`);
        
        // Tạm thời: Chúng ta cần 1 API để lấy thông tin chi tiết user sau khi login
        // Vì API list không có, chúng ta sẽ tạm thời chỉ lưu username và token
        // GÓI Ý: Bạn nên cập nhật API login để trả về cả roles
        
        // Tạm thời chỉ lưu username (cần cập nhật API)
        const fakeUser = { username: username, roles: [{name: 'ROLE_ADMIN'}] }; // Tạm giả định là ADMIN để test
        this.user = fakeUser;
        localStorage.setItem('user', JSON.stringify(fakeUser));

        // 4. Lấy thông tin chi tiết user (cần API /api/v1/users/me)
        // await this.fetchUser(); // (Sẽ làm ở bước sau)


        // 5. Điều hướng đến Dashboard
        router.push('/')

        return response
      } catch (error) {
        console.error('Login failed:', error)
        throw error // Ném lỗi để component Login có thể bắt
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
      router.push('/login')
    },
    
    // (Chúng ta sẽ thêm action fetchUser() sau khi có API)
  }
})