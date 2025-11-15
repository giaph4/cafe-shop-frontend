import apiClient from './axios'

const CUSTOMERS_BASE_URL = '/api/v1/customers'

const normalizeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    )

const normalizePayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    )

const get = (path = '', params) =>
    apiClient.get(`${CUSTOMERS_BASE_URL}${path}`, { params: normalizeParams(params) })

const post = (path = '', payload) =>
    apiClient.post(`${CUSTOMERS_BASE_URL}${path}`, normalizePayload(payload))

const put = (path = '', payload) =>
    apiClient.put(`${CUSTOMERS_BASE_URL}${path}`, normalizePayload(payload))

const remove = (path = '', params) =>
    apiClient.delete(`${CUSTOMERS_BASE_URL}${path}`, { params: normalizeParams(params) })

export const searchCustomers = (params) => get('', params)

export const createCustomer = (customerData) => post('', customerData)

export const updateCustomer = (id, customerData) => put(`/${id}`, customerData)

export const deleteCustomer = (id) => remove(`/${id}`)

export const searchCustomersSimple = (keyword) =>
    get('', { page: 0, size: 20, keyword })

export const getCustomerPurchaseHistory = (id, params) =>
    get(`/${id}/purchase-history`, params)
