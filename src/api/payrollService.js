import apiClient from './axios'

const PAYROLL_BASE_URL = '/api/v1/shifts/payroll'

const normalizeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    )

const normalizePayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    )

const get = (path = '', params) =>
    apiClient.get(`${PAYROLL_BASE_URL}${path}`, { params: normalizeParams(params) })

const post = (path = '', payload) =>
    apiClient.post(`${PAYROLL_BASE_URL}${path}`, normalizePayload(payload))

const put = (path = '', payload) =>
    apiClient.put(`${PAYROLL_BASE_URL}${path}`, normalizePayload(payload))

export const getPayrollCycles = (params = {}) => get('/cycles', params)

export const getPayrollCycleById = (id) => get(`/cycles/${id}`)

export const createPayrollCycle = (payload) => post('/cycles', payload)

export const updatePayrollCycle = (id, payload) => put(`/cycles/${id}`, payload)

export const regeneratePayrollCycle = (id) => post(`/cycles/${id}/regenerate`)

export const getPayrollSummaries = (params = {}) => get('/summaries', params)
