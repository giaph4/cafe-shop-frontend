// src/store/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as authService from '@/api/authService'
import * as userService from '@/api/userService'
import apiClient from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()

    const user = ref(JSON.parse(localStorage.getItem('user')))
    const token = ref(localStorage.getItem('token'))

    const isAuthenticated = computed(() => !!token.value)

    function setAxiosToken(token) {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
            delete apiClient.defaults.headers.common['Authorization']
        }
    }

    async function init() {
        const localToken = localStorage.getItem('token')
        const localUser = localStorage.getItem('user')

        if (localToken && localUser) {
            token.value = localToken
            user.value = JSON.parse(localUser)
            setAxiosToken(localToken)
        }
    }

    async function login(credentials) {
        try {
            // 1. Gọi API đăng nhập
            const response = await authService.login(credentials)

            // 2. Lấy token và ID từ kết quả đăng nhập
            const authToken = response.data.token
            const userId = response.data.user.id // Lấy ID từ user DTO

            token.value = authToken
            localStorage.setItem('token', authToken)
            setAxiosToken(authToken)

            // 3. HOÀN NGUYÊN LOGIC:
            // Dùng ID vừa có để gọi hàm fetch (Bây giờ đã chạy được)
            await fetchUserProfile(userId)

            router.push('/') // Chuyển về trang chủ

        } catch (error) {
            console.error('Đăng nhập thất bại:', error)
            throw error
        }
    }

    // HÀM NÀY BÂY GIỜ SẼ CHẠY ĐÚNG
    async function fetchUserProfile(id) {
        if (!id) {
            console.error('Không có ID để fetch user')
            return logout()
        }

        try {
            // 4. Dùng hàm GET /api/v1/users/{id}
            // (Bây giờ đã an toàn để gọi vì BE đã sửa @PreAuthorize)
            const response = await userService.getUserById(id)

            // 5. Lưu thông tin đầy đủ vào 'user'
            user.value = response.data
            localStorage.setItem('user', JSON.stringify(response.data))

        } catch (error) {
            console.error('Không thể lấy thông tin user:', error)
            // Nếu vẫn lỗi, user này có thể bị lỗi gì đó, nên logout
            logout()
        }
    }

    function logout() {
        user.value = null
        token.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setAxiosToken(null)
        router.push('/login')
    }

    return {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        fetchUserProfile, // Dùng cho 2 modal
        init,
    }
})