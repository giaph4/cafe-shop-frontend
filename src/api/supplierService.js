// src/api/supplierService.js
import apiClient from './axios'

/**
 * Lấy TẤT CẢ nhà cung cấp (API không phân trang)
 */
export const getAllSuppliers = () => {
    return apiClient.get('/api/v1/suppliers')
}

/**
 * Tạo nhà cung cấp mới
 * @param {object} supplierData - { name, contactPerson, phone, email, address }
 */
export const createSupplier = (supplierData) => {
    return apiClient.post('/api/v1/suppliers', supplierData)
}

/**
 * Cập nhật thông tin nhà cung cấp
 * @param {number} id - ID nhà cung cấp
 * @param {object} supplierData - { name, contactPerson, phone, email, address }
 */
export const updateSupplier = (id, supplierData) => {
    return apiClient.put(`/api/v1/suppliers/${id}`, supplierData)
}

/**
 * Xóa nhà cung cấp (Chỉ Admin)
 * @param {number} id - ID nhà cung cấp
 */
export const deleteSupplier = (id) => {
    return apiClient.delete(`/api/v1/suppliers/${id}`)
}
