// src/api/categoryService.js
import apiClient from './axios'

/**
 * Lấy TẤT CẢ danh mục (dùng cho dropdown và bảng)
 */
export const getAllCategories = () => {
    return apiClient.get('/api/v1/categories')
}

/**
 * Tạo danh mục mới
 * @param {object} categoryData - { name, description }
 */
export const createCategory = (categoryData) => {
    return apiClient.post('/api/v1/categories', categoryData)
}

/**
 * Cập nhật danh mục
 * @param {number} id - ID danh mục
 * @param {object} categoryData - { name, description }
 */
export const updateCategory = (id, categoryData) => {
    return apiClient.put(`/api/v1/categories/${id}`, categoryData)
}

/**
 * Xóa danh mục
 * @param {number} id - ID danh mục
 */
export const deleteCategory = (id) => {
    return apiClient.delete(`/api/v1/categories/${id}`)
}
