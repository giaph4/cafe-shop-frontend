// src/api/customerService.js
import apiClient from './axios'

/**
 * Lấy danh sách khách hàng (phân trang, tìm kiếm)
 * @param {object} params - { page, size, keyword }
 */
export const searchCustomers = (params) => {
    return apiClient.get('/api/v1/customers', { params })
}

/**
 * Tạo khách hàng mới
 * @param {object} customerData - { fullName, phone, email }
 */
export const createCustomer = (customerData) => {
    return apiClient.post('/api/v1/customers', customerData)
}

/**
 * Cập nhật thông tin khách hàng
 * @param {number} id - ID khách hàng
 * @param {object} customerData - { fullName, phone, email }
 */
export const updateCustomer = (id, customerData) => {
    return apiClient.put(`/api/v1/customers/${id}`, customerData)
}

/**
 * Xóa khách hàng
 * @param {number} id - ID khách hàng
 */
export const deleteCustomer = (id) => {
    return apiClient.delete(`/api/v1/customers/${id}`)
}

/**
 * Tìm kiếm khách hàng (đơn giản, cho POS)
 * @param {string} keyword - Tên hoặc SĐT
 */
export const searchCustomersSimple = (keyword) => {
    const params = {
        page: 0,
        size: 20, // Giới hạn 20 kết quả
        keyword: keyword
    }
    return apiClient.get('/api/v1/customers', { params })
}