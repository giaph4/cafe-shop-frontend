// src/api/userService.js
import apiClient from './axios'

/**
 * Lấy danh sách nhân viên (phân trang)
 * @param {object} params - { page, size, sort }
 */
export const getUsers = (params) => {
    return apiClient.get('/api/v1/users', { params })
}

/**
 * Lấy user theo ID (Bây giờ đã an toàn cho self-service)
 * @param {number} id 
 */
export const getUserById = (id) => {
    return apiClient.get(`/api/v1/users/${id}`)
}

/**
 * Cập nhật thông tin và quyền của nhân viên (ADMIN or self)
 * API: PUT /api/v1/users/{id}
 * @param {number} id - ID nhân viên
 * @param {object} userData - UserUpdateRequestDTO
 */
export const updateUser = (id, userData) => {
    return apiClient.put(`/api/v1/users/${id}`, userData)
}

/**
 * Đăng ký nhân viên mới
 * @param {object} userData - RegisterRequestDTO { username, password, fullName, email, phone }
 */
export const registerUser = (userData) => {
    return apiClient.post('/api/v1/auth/register', userData)
}

/**
 * Đổi mật khẩu của người dùng (người đang đăng nhập)
 * API: POST /api/v1/users/change-password
 * @param {object} passwordData - { currentPassword, newPassword, confirmationPassword }
 */
export const changePassword = (passwordData) => {
    // SỬA LỖI: Đổi từ PUT /{id}/password sang POST /change-password
    return apiClient.post('/api/v1/users/change-password', passwordData)
}