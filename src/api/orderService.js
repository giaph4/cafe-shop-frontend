// src/api/orderService.js
import apiClient from './axios'

const ORDERS_BASE_URL = '/api/v1/orders'

const normalizeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    )

const normalizePayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    )

const buildPayload = (payload) => {
    if (payload === undefined) return undefined
    if (payload instanceof FormData) return payload
    return normalizePayload(payload)
}

const get = (path = '', params) =>
    apiClient.get(`${ORDERS_BASE_URL}${path}`, {params: normalizeParams(params)})

const post = (path = '', payload) =>
    apiClient.post(`${ORDERS_BASE_URL}${path}`, buildPayload(payload))

const put = (path = '', payload) =>
    apiClient.put(`${ORDERS_BASE_URL}${path}`, buildPayload(payload))

const patch = (path = '', payload) =>
    apiClient.patch(`${ORDERS_BASE_URL}${path}`, buildPayload(payload))

const remove = (path = '', params) =>
    apiClient.delete(`${ORDERS_BASE_URL}${path}`, {params: normalizeParams(params)})

export const getAllOrders = (params) => get('', params)

export const getOrdersByStatus = (status, params) => get(`/status/${status}`, params)

export const getOrdersByDateRange = (startDate, endDate, params) =>
    get('/date-range', {...params, startDate, endDate})

export const cancelOrder = (orderId) => post(`/${orderId}/cancel`)

export const getOrderById = (orderId) => get(`/${orderId}`)

export const getPendingOrderByTable = (tableId) => get(`/table/${tableId}/pending`)

export const createOrder = (orderData) => post('', orderData)

export const addItemToOrder = (orderId, itemData) => post(`/${orderId}/items`, itemData)

export const updateItemInOrder = (orderId, orderDetailId, itemData) =>
    put(`/${orderId}/items/${orderDetailId}`, itemData)

export const removeItemFromOrder = (orderId, orderDetailId) =>
    remove(`/${orderId}/items/${orderDetailId}`)

export const applyVoucher = (orderId, voucherCode) =>
    post(`/${orderId}/voucher`, {voucherCode})

export const removeVoucher = (orderId) => remove(`/${orderId}/voucher`)

export const payOrder = (orderId, paymentData) => post(`/${orderId}/payment`, paymentData)
