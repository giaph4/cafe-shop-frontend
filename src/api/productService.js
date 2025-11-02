// src/api/productService.js
import apiClient from './axios'

/**
 * Lấy danh sách sản phẩm (phân trang, lọc)
 * @param {object} params - { page, size, name, categoryId }
 */
export const getProducts = (params) => {
    return apiClient.get('/api/v1/products', { params })
}

/**
 * Lấy chi tiết 1 sản phẩm
 * @param {number} id - ID sản phẩm
 */
export const getProductById = (id) => {
    return apiClient.get(`/api/v1/products/${id}`)
}

/**
 * Tạo sản phẩm mới (dùng FormData)
 * @param {object} productData - Dữ liệu JSON của sản phẩm
 * @param {File} imageFile - File ảnh (có thể null)
 */
export const createProduct = (productData, imageFile) => {
    const formData = new FormData()

    // 1. Thêm JSON data (dưới dạng Blob)
    formData.append('product', new Blob([JSON.stringify(productData)], {
        type: 'application/json'
    }))

    // 2. Thêm file ảnh (nếu có)
    if (imageFile) {
        formData.append('image', imageFile)
    }

    return apiClient.post('/api/v1/products', formData, {
        headers: {
            'Content-Type': 'multipart/form-data' // Quan trọng
        }
    })
}

/**
 * Cập nhật sản phẩm (dùng FormData)
 * @param {number} id - ID sản phẩm
 * @param {object} productData - Dữ liệu JSON của sản phẩm
 * @param {File} imageFile - File ảnh mới (có thể null)
 */
export const updateProduct = (id, productData, imageFile) => {
    const formData = new FormData()

    // 1. Thêm JSON data
    formData.append('product', new Blob([JSON.stringify(productData)], {
        type: 'application/json'
    }))

    // 2. Thêm file ảnh (nếu có)
    if (imageFile) {
        formData.append('image', imageFile)
    }

    // Gọi API PUT (Backend của bạn dùng @PutMapping cho multipart)
    return apiClient.put(`/api/v1/products/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data' // Quan trọng
        }
    })
}

/**
 * Xóa sản phẩm
 * @param {number} id - ID sản phẩm
 */
export const deleteProduct = (id) => {
    return apiClient.delete(`/api/v1/products/${id}`)
}

/**
 * Ẩn/Hiện sản phẩm
 * @param {number} id - ID sản phẩm
 */
export const toggleProductAvailability = (id) => {
    return apiClient.patch(`/api/v1/products/${id}/toggle-availability`)
}

/**
 * Lấy TẤT CẢ sản phẩm ĐANG BÁN (cho modal chọn món)
 */
export const getAvailableProducts = () => {
    const params = {
        page: 0,
        size: 1000, // Lấy 1 trang lớn
        // API của bạn thiếu filter "available=true",
        // chúng ta sẽ lọc ở frontend
    }
    return apiClient.get('/api/v1/products', { params })
}

/**
 * [MỚI] Lấy công thức (danh sách nguyên vật liệu) của 1 sản phẩm
 * @param {number} productId - ID sản phẩm
 */
export const getProductRecipe = (productId) => {
    return apiClient.get(`/api/v1/products/${productId}/recipe`)
}

/**
 * [MỚI] Cập nhật (ghi đè) công thức của 1 sản phẩm
 * @param {number} productId - ID sản phẩm
 * @param {object} recipeData - ProductRecipeDTO { ingredients: [...] }
 *
 */
export const setProductRecipe = (productId, recipeData) => {
    return apiClient.put(`/api/v1/products/${productId}/recipe`, recipeData)
}