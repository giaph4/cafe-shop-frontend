import apiClient from './axios'

const NORMALIZED_METHODS = ['CASH', 'TRANSFER', 'CARD']

export function normalizePaymentMethod(method) {
    if (!method) {
        throw new Error('Thiếu phương thức thanh toán')
    }

    const normalized = method.trim().toUpperCase()

    if (!NORMALIZED_METHODS.includes(normalized)) {
        throw new Error('Phương thức thanh toán không hợp lệ')
    }

    return normalized
}

export function payOrder(orderId, {paymentMethod, customerId}) {
    const normalizedMethod = normalizePaymentMethod(paymentMethod)

    const payload = {
        paymentMethod: normalizedMethod,
        ...(customerId ? {customerId} : {}),
    }

    return apiClient.post(`/api/v1/orders/${orderId}/payment`, payload)
}
