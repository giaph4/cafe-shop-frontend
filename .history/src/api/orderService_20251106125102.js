import api from './axios';

// 1. Tạo Order Mới
export const createOrder = (orderCreateDTO) => {
    return api.post('/api/v1/orders', orderCreateDTO);
};

// 2. Lấy Order tại Bàn
export const getPendingOrderByTable = (tableId) => {
    return api.get(`/api/v1/orders/table/${tableId}/pending`);
};

// 3. Thêm món vào Order
export const addOrderItem = (orderId, orderDetailDTO) => {
    return api.post(`/api/v1/orders/${orderId}/items`, orderDetailDTO);
};

// 4. Sửa món trong Order
export const updateOrderItem = (orderId, orderDetailId, updateDTO) => {
    return api.put(`/api/v1/orders/${orderId}/items/${orderDetailId}`, updateDTO);
};

// 5. Xóa món khỏi Order
export const deleteOrderItem = (orderId, orderDetailId) => {
    return api.delete(`/api/v1/orders/${orderId}/items/${orderDetailId}`);
};

// 6. Áp dụng Voucher
export const applyVoucher = (orderId, voucherCode) => {
    return api.post(`/api/v1/orders/${orderId}/voucher`, { voucherCode });
};

// 7. Xóa Voucher
export const deleteVoucher = (orderId) => {
    return api.delete(`/api/v1/orders/${orderId}/voucher`);
};

// 8. Thanh Toán
export const payOrder = (orderId, paymentDTO) => {
    return api.post(`/api/v1/orders/${orderId}/payment`, paymentDTO);
};

// 9. Hủy Đơn
export const cancelOrder = (orderId) => {
    return api.post(`/api/v1/orders/${orderId}/cancel`);
};

// Lấy danh sách order (cho trang quản lý)
export const getOrders = (params) => {
    return api.get('/api/v1/orders', { params });
};

// Lấy chi tiết order (cho trang quản lý)
export const getOrderById = (orderId) => {
    return api.get(`/api/v1/orders/${orderId}`);
};