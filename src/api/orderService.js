// src/api/orderService.js
import apiClient from './axios'

// --- API Quản lý (Admin List View) ---

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


// --- API Nghiệp vụ (POS View & Staff) ---

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
        console.log('=== CREATE ORDER REQUEST ===')
        console.log('Request Data:', orderData)
        console.log('Request JSON:', JSON.stringify(orderData, null, 2))
        console.log('============================')
        
        const response = await apiClient.post('/api/v1/orders', orderData)
        
        console.log('=== ORDER CREATED SUCCESS ===')
        console.log('Response:', response.data)
        console.log('=============================')
        return response
    } catch (error) {
        console.log('=== CREATE ORDER ERROR ===')
        console.log('Status:', error.response?.status)
        console.log('Error Data:', error.response?.data)
        console.log('Message:', error.response?.data?.message || error.message)
        console.log('Full Error:', error)
        console.log('==========================')
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