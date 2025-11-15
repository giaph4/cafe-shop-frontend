import apiClient from './axios'

const AUTH_BASE_URL = '/api/v1/auth'

const normalizePayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    )

/**
 * Đăng nhập
 * @param {object} credentials - { username, password }
 */
export const login = (credentials = {}) =>
    apiClient.post(`${AUTH_BASE_URL}/login`, normalizePayload(credentials))

/**
 * Đăng ký tài khoản (Tạo Staff mới)
 * @param {object} userData - RegisterRequestDTO { username, password, fullName, email, phone }
 */
export const register = (userData = {}) =>
    apiClient.post(`${AUTH_BASE_URL}/register`, normalizePayload(userData))
