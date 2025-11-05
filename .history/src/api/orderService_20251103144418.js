import api from './axios'

// Lấy tất cả đơn hàng (cho lịch sử)
export const getAllOrders = (params) => {
  return api.get('/orders', { params })
}

// Lấy 1 đơn hàng theo ID (để xem chi tiết)
export const getOrderById = (id) => {
  return api.get(`/orders/${id}`)
}

// Tạo đơn hàng mới (cho cả tại bàn và mang về)
export const createOrder = (orderData) => {
  return api.post('/orders', orderData)
}

// Cập nhật đơn hàng (ví dụ: đổi bàn, đổi trạng thái - không dùng cho thanh toán)
export const updateOrder = (id, orderData) => {
  return api.put(`/orders/${id}`, orderData)
}

// Xóa đơn hàng (nếu cần)
export const deleteOrder = (id) => {
  return api.delete(`/orders/${id}`)
}

// Thêm món mới vào đơn hàng ĐÃ TỒN TẠI
export const addOrderDetail = (orderId, itemData) => {
  return api.post(`/orders/${orderId}/details`, itemData)
}

// Cập nhật số lượng/giá của món trong đơn hàng
export const updateOrderDetail = (orderId, detailId, updateData) => {
  return api.put(`/orders/${orderId}/details/${detailId}`, updateData)
}

// Xóa 1 món khỏi đơn hàng
export const removeOrderDetail = (orderId, detailId) => {
  return api.delete(`/orders/${orderId}/details/${detailId}`)
}

// === BỔ SUNG CÁC HÀM CẦN THIẾT CHO LUỒNG MỚI ===

/**
 * [MỚI] Thanh toán một đơn hàng
 * @param {number} id ID của đơn hàng
 * @param {object} paymentData Dữ liệu thanh toán (ví dụ: { voucherCode: 'CODE123' })
 */
export const payOrder = (id, paymentData) => {
  return api.post(`/orders/${id}/pay`, paymentData)
}

/**
 * [MỚI] Lấy tất cả các đơn hàng đang ở trạng thái PENDING
 */
export const getPendingOrders = () => {
  return api.get('/orders/status/PENDING')
}