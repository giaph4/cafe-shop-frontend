// src/api/categoryService.js
import apiClient from './axios'

/**
 * Lấy TẤT CẢ danh mục (dùng cho dropdown)
 */
export const getAllCategories = () => {
  // API của bạn (/api/v1/categories) trả về List (không phân trang)
  return apiClient.get('/api/v1/categories')
}