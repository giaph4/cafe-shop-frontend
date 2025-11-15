// src/api/supplierService.js
import apiClient from './axios'

const SUPPLIERS_BASE_URL = '/api/v1/suppliers'

const normalizePayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    )

const get = (path = '') => apiClient.get(`${SUPPLIERS_BASE_URL}${path}`)

const post = (path = '', payload) =>
    apiClient.post(`${SUPPLIERS_BASE_URL}${path}`, normalizePayload(payload))

const put = (path = '', payload) =>
    apiClient.put(`${SUPPLIERS_BASE_URL}${path}`, normalizePayload(payload))

const remove = (path = '') =>
    apiClient.delete(`${SUPPLIERS_BASE_URL}${path}`)

export const getAllSuppliers = () => get()

export const createSupplier = (supplierData) => post('', supplierData)

export const updateSupplier = (id, supplierData) => put(`/${id}`, supplierData)

export const deleteSupplier = (id) => remove(`/${id}`)
