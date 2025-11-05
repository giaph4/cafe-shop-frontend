// src/store/auth.js (File này của bạn đang bị thiếu hoặc sai)
// Bạn phải sửa file này của mình!

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as authService from '@/api/authService' // Giả sử bạn có file này
import * as userService from '@/api/userService' // File bạn vừa cung cấp
import apiClient from '@/api/axios' // File axios

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()

    // Dữ liệu user đang bị rỗng (null) -> Trang Profile "ko hiện"
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

    // GỌI HÀM NÀY KHI APP KHỞI ĐỘNG
    // Nếu có token, nó sẽ tự động lấy lại thông tin user
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
            // (Giả sử backend trả về: { token: "...", user: { id: 1, ... } })
            const authToken = response.data.token
            const userId = response.data.user.id // LẤY ID TỪ ĐÂY

            token.value = authToken
            localStorage.setItem('token', authToken)
            setAxiosToken(authToken)

            // 3. *** BƯỚC QUAN TRỌNG NHẤT (ĐANG BỊ THIẾU) ***
            // Dùng ID vừa có để gọi hàm bạn chỉ ra
            await fetchUserProfile(userId)

            router.push('/') // Chuyển về trang chủ

        } catch (error) {
            console.error('Đăng nhập thất bại:', error)
            throw error
        }
    }

    // HÀM QUAN TRỌNG ĐỂ LẤY THÔNG TIN USER
    async function fetchUserProfile(id) {
        if (!id) {
            console.error('Không có ID để fetch user')
            return logout()
        }

        try {
            // 4. Dùng hàm bạn chỉ để lấy full thông tin (roles, status...)
            const response = await userService.getUserById(id)

            // 5. Lưu thông tin vào 'user'
            user.value = response.data
            localStorage.setItem('user', JSON.stringify(response.data))

        } catch (error) {
            console.error('Không thể lấy thông tin user:', error)
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
        init, // Dùng cho App.vue
    }
})