// src/api/ingredientService.js
import apiClient from './axios'

/**
 * Lấy danh sách nguyên vật liệu (phân trang, tìm kiếm)
 * @param {object} params - { page, size, name }
 */
export const getIngredients = (params) => {
    return apiClient.get('/api/v1/ingredients', { params })
}

/**
 * Tạo nguyên vật liệu mới
 * @param {object} ingredientData - { name, unit, reorderLevel }
 */
export const createIngredient = (ingredientData) => {
    return apiClient.post('/api/v1/ingredients', ingredientData)
}

/**
 * Cập nhật thông tin nguyên vật liệu (KHÔNG CẬP NHẬT TỒN KHO)
 * @param {number} id - ID nguyên vật liệu
 * @param {object} ingredientData - { name, unit, reorderLevel }
 */
export const updateIngredient = (id, ingredientData) => {
    // API này chỉ cập nhật info, không cập nhật quantityOnHand
    return apiClient.put(`/api/v1/ingredients/${id}`, ingredientData)
}

export const deleteIngredient = (id) => {
    return apiClient.delete(`/api/v1/ingredients/${id}`)
}

export const adjustInventory = (adjustmentData) => {
    return apiClient.patch('/api/v1/ingredients/adjust-inventory', adjustmentData)
}

export const getAllIngredientsSimple = () => {
    
    const params = {
      page: 0,
      size: 1000, 
      sort: 'name,asc'
    }
    return apiClient.get('/api/v1/ingredients', { params })
  }