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
    },
    timeout: 15000,
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
        const status = error.response?.status

        if (status === 401) {
            const authStore = useAuthStore()

            if (import.meta.env.DEV) {
                console.warn('[axios] Unauthorized (401) received. Triggering logout sequence.')
            }

            if (router.currentRoute.value.name !== 'Login') {
                authStore.logout()
            }
        }

        if (status === 403) {
            if (import.meta.env.DEV) {
                console.warn('[axios] Forbidden (403) received. Redirecting to dashboard.')
            }
            if (router.hasRoute && router.hasRoute('Forbidden')) {
                router.replace({ name: 'Forbidden' }).catch(() => {})
            } else {
                router.replace({ name: 'Dashboard' }).catch(() => {})
            }
        }

        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            console.error('[axios] Request timed out after 15s:', error.config?.url)
        }
        return Promise.reject(error)
    }
)

export default apiClient
