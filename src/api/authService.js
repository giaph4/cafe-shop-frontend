// src/api/authService.js
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
 * [cite: giaph4/cafe-shop-backend/cafe-shop-backend-0a2a327b746e18257452b0f82b74bc84858fdcc6/src/main/java/com/giapho/coffee_shop_backend/dto/RegisterRequest.java]
 */
export const register = (userData) => {
    return apiClient.post('/api/v1/auth/register', userData)
}