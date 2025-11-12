// src/store/auth.js (Đã nâng cấp)
import { defineStore } from 'pinia'
import router from '@/router'
import { jwtDecode } from 'jwt-decode'
import * as authService from '@/api/authService.js' // <-- THAY ĐỔI: Import service mới
import * as userService from '@/api/userService.js'
import { normalizeRoles } from '@/utils/roles'
import { startShiftSession, clearShiftSession } from '@/utils/shiftManager.js'

const USER_STORAGE_KEY = 'user'

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

const getStoredUser = () => {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
        try {
            return JSON.parse(stored)
        } catch (error) {
            console.warn('Invalid stored user payload, clearing cache.', error)
            localStorage.removeItem(USER_STORAGE_KEY)
        }
    }
    return decodeToken(localStorage.getItem('token'))
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: getStoredUser(),
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        roles: (state) => normalizeRoles(state.user?.roles || []),
        isAdmin() {
            return this.roles.includes('ROLE_ADMIN')
        },
        isManager() {
            return this.roles.includes('ROLE_MANAGER') || this.roles.includes('ROLE_ADMIN')
        },
        isStaff() {
            return this.roles.includes('ROLE_STAFF') || this.roles.includes('ROLE_MANAGER') || this.roles.includes('ROLE_ADMIN')
        },
        userFullName: (state) => state.user?.fullName || state.user?.username || 'User',
    },

    actions: {
        /**
         * Xử lý sau khi login/register thành công
         */
        async _handleAuthSuccess(tokenString) { // Renamed argument for clarity
            // 1. Lưu token vào state và localStorage
            this.token = tokenString
            localStorage.setItem('token', tokenString)

            // 2. Cài đặt token cho Axios (Đã được xử lý bởi Request Interceptor trong axios.js)

            // 3. Giải mã token và lưu thông tin user vào state và localStorage
            this.user = decodeToken(tokenString)
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user))

            // 4. Đồng bộ hồ sơ đầy đủ (bao gồm avatar, địa chỉ)
            await this.fetchUserProfile()

            // 5. Khởi tạo ca làm việc cho người dùng
            startShiftSession(this.user)

            // 6. Điều hướng về trang chủ
            router.push('/')
        },

        /**
         * Action Đăng nhập
         */
        async login(credentials) {
            try {
                const response = await authService.login(credentials)
                const { token } = response.data

                await this._handleAuthSuccess(token) // Gọi hàm xử lý chung

                return response
            } catch (error) {
                console.error('Login failed:', error)
                this.logout()
                throw error
            }
        },

        /**
         * Action Đăng ký
         */
        async register(userData) {
            try {
                // 1. Gọi API register
                const response = await authService.register(userData)

                const { token } = response.data
                // 2. Xử lý thành công (coi như đã login)
                await this._handleAuthSuccess(token)

                return response
            } catch (error) {
                console.error('Register failed:', error)
                throw error
            }
        },

        async fetchUserProfile() {
            try {
                const userId = this.user?.userId
                if (!userId) return null

                const response = await userService.getUserById(userId)
                const profile = response.data

                // Gộp dữ liệu token và hồ sơ để giữ nguyên các quyền/ID đã giải mã
                this.user = {
                    ...this.user,
                    ...profile,
                    userId: profile.id ?? this.user?.userId,
                    roles: profile.roles ?? this.user?.roles,
                }

                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user))
                return profile
            } catch (error) {
                console.error('Không thể tải thông tin hồ sơ người dùng:', error)
                return null
            }
        },

        /**
         * Action Đăng xuất
         */
        logout() {
            const userId = this.user?.userId
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem(USER_STORAGE_KEY)
            if (userId) {
                clearShiftSession(userId)
            }
            router.replace('/login')
        },
    }
})
