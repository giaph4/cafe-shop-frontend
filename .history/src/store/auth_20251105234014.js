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
            // 1. Gọi API đăng nhập. Backend (AuthenticationResponse)
            //    đã trả về đầy đủ { token: "...", user: { ...FULL DTO... } }
            const response = await authService.login(credentials)

            const authToken = response.data.token
            // 2. LẤY TOÀN BỘ USER DTO TỪ RESPONSE LOGIN
            const fullUser = response.data.user

            token.value = authToken
            localStorage.setItem('token', authToken)
            setAxiosToken(authToken)

            // 3. SỬA LỖI:
            // KHÔNG GỌI fetchUserProfile(userId) (vì đó là API admin)
            // Thay vào đó, SỬ DỤNG TRỰC TIẾP 'fullUser'
            setUser(fullUser)

            router.push('/') // Chuyển về trang chủ

        } catch (error) {
            console.error('Đăng nhập thất bại:', error)
            throw error
        }
    }

    // HÀM MỚI: Dùng để lưu thông tin user vào store và localStorage
    function setUser(newUserData) {
        if (newUserData) {
            user.value = newUserData
            localStorage.setItem('user', JSON.stringify(newUserData))
        } else {
            // Xử lý nếu newUserData là null/undefined (an toàn)
            user.value = null
            localStorage.removeItem('user')
        }
    }

    // HÀM NÀY BÂY GIỜ CHỈ CÒN Ý NGHĨA KHI ADMIN GỌI
    // (Chúng ta sẽ không dùng nó sau khi sửa profile nữa)
    async function fetchUserProfile(id) {
        if (!id) {
            console.error('Không có ID để fetch user')
            return logout()
        }
        try {
            const response = await userService.getUserById(id)
            setUser(response.data) // Dùng hàm setUser
        } catch (error) {
            console.error('Không thể lấy thông tin user (có thể do không phải Admin):', error)
            // SỬA LỖI: KHÔNG GỌI logout() ở đây.
            // Nếu gọi logout, user sẽ bị đá ra khi sửa profile.
            // throw error // Ném lỗi để modal có thể bắt
        }
    }

    function logout() {
        setUser(null) // Dùng hàm setUser để dọn dẹp
        token.value = null
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
        fetchUserProfile, // Vẫn export
        init,
        setUser, // THÊM HÀM NÀY
    }
})