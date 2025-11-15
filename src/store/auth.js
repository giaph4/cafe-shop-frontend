// src/store/auth.js (Đã nâng cấp)
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import router from '@/router'
import { jwtDecode } from 'jwt-decode'
import * as authService from '@/api/authService.js'
import * as userService from '@/api/userService.js'
import { normalizeRoles } from '@/utils/roles'
import { startShiftSession, clearShiftSession } from '@/utils/shiftManager.js'
import { createTaskManager } from '@/utils/storeHelpers.js'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'

const persistToken = (token) => {
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
}

const persistUser = (user) => {
    if (user && Object.keys(user).length > 0) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
        localStorage.removeItem(USER_STORAGE_KEY)
    }
}

const clearStoredSession = () => {
    persistToken(null)
    persistUser(null)
}

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
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(USER_STORAGE_KEY)
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
    return decodeToken(localStorage.getItem(TOKEN_STORAGE_KEY))
}

export const useAuthStore = defineStore('auth', () => {
    const toast = useToast()
    const token = ref(localStorage.getItem(TOKEN_STORAGE_KEY) || null)
    const user = ref(getStoredUser())

    const { loadingAction, lastError, isLoading, runTask } = createTaskManager({ toast })

    const isAuthenticated = computed(() => !!token.value)
    const roles = computed(() => normalizeRoles(user.value?.roles || []))
    const isAdmin = computed(() => roles.value.includes('ROLE_ADMIN'))
    const isManager = computed(() => roles.value.some((role) => ['ROLE_MANAGER', 'ROLE_ADMIN'].includes(role)))
    const isStaff = computed(() => roles.value.length > 0)
    const userFullName = computed(() => user.value?.fullName || user.value?.username || 'User')

    const setSession = (tokenString, userPayload) => {
        token.value = tokenString
        persistToken(tokenString)

        user.value = userPayload || null
        persistUser(user.value)
    }

    const clearSessionState = () => {
        token.value = null
        user.value = null
        clearStoredSession()
    }

    const fetchUserProfile = async () => {
        const userId = user.value?.userId
        if (!userId) return null

        return await runTask('auth-fetch-profile', async () => {
            const response = await userService.getUserById(userId)
            const profile = response.data

            user.value = {
                ...user.value,
                ...profile,
                userId: profile.id ?? user.value?.userId,
                roles: profile.roles ?? user.value?.roles,
            }

            persistUser(user.value)
            return profile
        }, { notify: false })
    }

    const handleAuthSuccess = async (tokenString) => {
        setSession(tokenString, decodeToken(tokenString))
        await fetchUserProfile()
        startShiftSession(user.value)
        router.push('/')
    }

    const login = async (credentials) => {
        try {
            const response = await runTask('auth-login', async () => authService.login(credentials), { notify: false })
            const { token: tokenString } = response.data
            await handleAuthSuccess(tokenString)
            return response
        } catch (error) {
            clearSessionState()
            throw error
        }
    }

    const register = async (userData) => {
        const response = await runTask('auth-register', async () => authService.register(userData), { notify: false })
        const { token: tokenString } = response.data
        await handleAuthSuccess(tokenString)
        return response
    }

    const logout = () => {
        const userId = user.value?.userId
        clearSessionState()
        if (userId) {
            clearShiftSession(userId)
        }
        router.replace('/login')
    }

    return {
        token,
        user,
        loadingAction,
        lastError,
        isLoading,
        isAuthenticated,
        roles,
        isAdmin,
        isManager,
        isStaff,
        userFullName,
        setSession,
        clearSession: clearSessionState,
        fetchUserProfile,
        login,
        register,
        logout,
    }
})
