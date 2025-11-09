import apiClient from './axios'

/**
 * Đăng nhập
 * @param {object} credentials - { username, password }
 */
export const login = (credentials) => {
    return apiClient.post('/api/v1/auth/login', credentials)
}

/**
 * Đăng ký tài khoản (Tạo Staff mới)
 * @param {object} userData - RegisterRequestDTO { username, password, fullName, email, phone }
 */
export const register = (userData) => {
    return apiClient.post('/api/v1/auth/register', userData)
}
