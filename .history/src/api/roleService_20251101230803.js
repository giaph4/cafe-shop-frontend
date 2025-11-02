// src/api/roleService.js
import apiClient from './axios'

/**
 * Lấy TẤT CẢ các vai trò (roles)
 * (YÊU CẦU BACKEND: Cần tạo 1 Controller (ví dụ: RoleController)
 * cho API GET /api/v1/roles trả về List<RoleDTO>)
 */
export const getAllRoles = () => {
    return apiClient.get('/api/v1/roles')
}