// src/api/orderService.js
import apiClient from './axios'

/**
 * [ADMIN] Lấy tất cả đơn hàng (phân trang)
 */
export const getAllOrders = (params) => {
    return apiClient.get('/api/v1/orders', { params })
}

/**
 * [ADMIN] Lấy đơn hàng theo trạng thái (phân trang)
 */
export const getOrdersByStatus = (status, params) => {
    return apiClient.get(`/api/v1/orders/status/${status}`, { params })
}

/**
 * [ADMIN] Lấy đơn hàng theo khoảng ngày (phân trang)
 */
export const getOrdersByDateRange = (startDate, endDate, params) => {
    return apiClient.get('/api/v1/orders/date-range', {
        params: { ...params, startDate, endDate }
    })
}

/**
 * [ADMIN] Hủy một đơn hàng PENDING
 * @param {number} orderId ID đơn hàng
 */
export const cancelOrder = (orderId) => {
    return apiClient.post(`/api/v1/orders/${orderId}/cancel`)
}

/**
 * [STAFF] Lấy chi tiết 1 đơn hàng (dùng cho cả admin và staff)
 * @param {number} orderId ID đơn hàng
 */
export const getOrderById = (orderId) => {
    return apiClient.get(`/api/v1/orders/${orderId}`)
}

/**
 * [STAFF] Lấy đơn hàng PENDING theo Bàn
 * @param {number} tableId ID của bàn
 */
export const getPendingOrderByTable = (tableId) => {
    return apiClient.get(`/api/v1/orders/table/${tableId}/pending`)
}

/**
 * [STAFF] Tạo đơn hàng mới
 * @param {object} orderData - OrderCreateRequestDTO
 */
export const createOrder = async (orderData) => {
    try {
        const response = await apiClient.post('/api/v1/orders', orderData)
        return response
    } catch (error) {
        throw error
    }
}

/**
 * [STAFF] Thêm món vào đơn hàng PENDING
 * @param {number} orderId ID đơn hàng
 * @param {object} itemData - OrderDetailRequestDTO { productId, quantity, notes }
 */
export const addItemToOrder = (orderId, itemData) => {
    return apiClient.post(`/api/v1/orders/${orderId}/items`, itemData)
}

/**
 * [STAFF] Cập nhật món trong đơn hàng PENDING
 * @param {number} orderId ID đơn hàng
 * @param {number} orderDetailId ID của dòng chi tiết
 * @param {object} itemData - OrderDetailUpdateRequestDTO { quantity, notes }
 */
export const updateItemInOrder = (orderId, orderDetailId, itemData) => {
    return apiClient.put(`/api/v1/orders/${orderId}/items/${orderDetailId}`, itemData)
}

/**
 * [STAFF] Xóa món khỏi đơn hàng PENDING
 * @param {number} orderId ID đơn hàng
 * @param {number} orderDetailId ID của dòng chi tiết
 */
export const removeItemFromOrder = (orderId, orderDetailId) => {
    return apiClient.delete(`/api/v1/orders/${orderId}/items/${orderDetailId}`)
}

/**
 * [STAFF] Áp dụng Voucher
 * @param {number} orderId ID đơn hàng
 * @param {string} voucherCode Mã voucher
 */
export const applyVoucher = (orderId, voucherCode) => {
    return apiClient.post(`/api/v1/orders/${orderId}/voucher`, { voucherCode })
}

/**
 * [STAFF] Gỡ bỏ Voucher
 * @param {number} orderId ID đơn hàng
 */
export const removeVoucher = (orderId) => {
    return apiClient.delete(`/api/v1/orders/${orderId}/voucher`)
}

/**
 * [STAFF] Thanh toán đơn hàng PENDING
 * @param {number} orderId ID đơn hàng
 * @param {object} paymentData - PaymentRequestDTO { paymentMethod }
 */
export const payOrder = (orderId, paymentData) => {
    return apiClient.post(`/api/v1/orders/${orderId}/payment`, paymentData)
}
