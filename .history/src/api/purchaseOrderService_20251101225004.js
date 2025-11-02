// src/api/purchaseOrderService.js
import apiClient from './axios'

/**
 * Lấy danh sách phiếu nhập (phân trang, lọc)
 * @param {object} params - { page, size, status, supplierId, startDate, endDate, sort }
 */
export const getAllPurchaseOrders = (params) => {
    return apiClient.get('/api/v1/purchase-orders', { params })
}

/**
 * Lấy chi tiết 1 phiếu nhập
 * @param {number} id - ID phiếu nhập
 */
export const getPurchaseOrderById = (id) => {
    return apiClient.get(`/api/v1/purchase-orders/${id}`)
}

/**
 * Tạo phiếu nhập mới
 * @param {object} poData - PurchaseOrderRequestDTO
 */
export const createPurchaseOrder = (poData) => {
    return apiClient.post('/api/v1/purchase-orders', poData)
}

/**
 * Đánh dấu phiếu nhập là HOÀN THÀNH (và cập nhật kho)
 * @param {number} id - ID phiếu nhập
 */
export const markAsCompleted = (id) => {
    return apiClient.post(`/api/v1/purchase-orders/${id}/complete`)
}

/**
 * Hủy một phiếu nhập (PENDING)
 * @param {number} id - ID phiếu nhập
 */
export const cancelPurchaseOrder = (id) => {
    return apiClient.post(`/api/v1/purchase-orders/${id}/cancel`)
}