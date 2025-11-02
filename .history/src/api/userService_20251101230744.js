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
 * Cập nhật thông tin và quyền của nhân viên (ADMIN only)
 * @param {number} id - ID nhân viên
 * @param {object} userData - UserUpdateRequestDTO
 */
export const updateUser = (id, userData) => {
    return apiClient.put(`/api/v1/users/${id}`, userData)
}