import api from './axios';

export const getAllOrders = () => {
    return api.get('/orders');
};

export const getOrderById = (id) => {
    return api.get(`/orders/${id}`);
};

export const createOrder = (orderData) => {
    return api.post('/orders', orderData);
};

export const updateOrderStatus = (id, status) => {
    return api.put(`/orders/${id}/status`, null, { params: { status } });
};

export const deleteOrder = (id) => {
    return api.delete(`/orders/${id}`);
};

// Cập nhật chi tiết một món trong đơn hàng
export const updateOrderDetail = (orderId, detailId, updateData) => {
    return api.put(`/orders/${orderId}/details/${detailId}`, updateData);
};

// Thêm món mới vào đơn hàng đã tồn tại
export const addOrderDetail = (orderId, itemData) => {
    return api.post(`/orders/${orderId}/details`, itemData);
};

// Xóa một món khỏi đơn hàng
export const removeOrderDetail = (orderId, detailId) => {
    return api.delete(`/orders/${orderId}/details/${detailId}`);
};

// --- BỔ SUNG CÁC HÀM MỚI CHO LUỒNG POS ---

/**
 * Thanh toán một đơn hàng
 * @param {number} id ID của đơn hàng
 * @param {object} paymentData Dữ liệu thanh toán (ví dụ: { voucherCode: 'CODE123' })
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export const payOrder = (id, paymentData) => {
    return api.post(`/orders/${id}/pay`, paymentData);
};

/**
 * Lấy tất cả các đơn hàng đang ở trạng thái PENDING
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export const getPendingOrders = () => {
    return api.get('/orders/pending');
};