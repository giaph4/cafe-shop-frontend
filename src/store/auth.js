// src/store/auth.js (Đã nâng cấp)
import { defineStore } from 'pinia'
import router from '@/router'
import { jwtDecode } from 'jwt-decode'
import * as authService from '@/api/authService.js' // <-- THAY ĐỔI: Import service mới

// Hàm helper giải mã token (giữ nguyên)
function decodeToken(token) {
    if (!token) return null
    try {
        const decoded = jwtDecode(token)
        return {
            userId: decoded.userId,
            username: decoded.sub,
            fullName: decoded.fullName,
            roles: decoded.authorities.map(auth => auth.authority)
        }
    } catch (error) {
        console.error('Invalid token:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return null
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: decodeToken(localStorage.getItem('token')),
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.roles?.includes('ROLE_ADMIN'),
        isManager: (state) => state.user?.roles?.includes('ROLE_MANAGER') || state.user?.roles?.includes('ROLE_ADMIN'),
        isStaff: (state) => state.user?.roles?.includes('ROLE_STAFF') || state.user?.roles?.includes('ROLE_MANAGER') || state.user?.roles?.includes('ROLE_ADMIN'),
        userFullName: (state) => state.user?.fullName || state.user?.username || 'User',
    },

    actions: {
        /**
         * (HÀM MỚI) Xử lý sau khi login/register thành công
         */
        _handleAuthSuccess(tokenString) { // Renamed argument for clarity
            // 1. Lưu token vào state và localStorage
            this.token = tokenString
            localStorage.setItem('token', tokenString)

            // 2. Cài đặt token cho Axios (Đã được xử lý bởi Request Interceptor trong axios.js)

            // 3. Giải mã token và lưu thông tin user vào state và localStorage
            this.user = decodeToken(tokenString)
            localStorage.setItem('user', JSON.stringify(this.user))

            // 4. Điều hướng về trang chủ
            router.push('/')
        },

        /**
         * (CẬP NHẬT) Action Đăng nhập
         */
        async login(credentials) {
            try {
                const response = await authService.login(credentials)
                const { token } = response.data

                this._handleAuthSuccess(token) // Gọi hàm xử lý chung

                return response
            } catch (error) {
                console.error('Login failed:', error)
                this.logout()
                throw error
            }
        },

        /**
         * (MỚI) Action Đăng ký
         */
        async register(userData) {
            try {
                // 1. Gọi API register
                const response = await authService.register(userData)

                // API trả về token y hệt login [cite: giaph4/cafe-shop-backend/cafe-shop-backend-0a2a327b746e18257452b0f82b74bc84858fdcc6/src/main/java/com/giapho/coffee_shop_backend/service/AuthenticationService.java]
                const { token } = response.data

                // 2. Xử lý thành công (coi như đã login)
                this._handleAuthSuccess(token)

                return response
            } catch (error) {
                console.error('Register failed:', error)
                throw error // Ném lỗi để form Register bắt
            }
        },

        /**
         * (GIỮ NGUYÊN) Action Đăng xuất
         */
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // Axios header will be cleared automatically by interceptor when token is null
            router.replace('/login')
        },
    }
})