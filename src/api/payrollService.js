import apiClient from './axios'

export const getPayrollCycles = (params = {}) => {
    return apiClient.get('/api/v1/shifts/payroll/cycles', { params })
}

export const getPayrollCycleById = (id) => {
    return apiClient.get(`/api/v1/shifts/payroll/cycles/${id}`)
}

export const createPayrollCycle = (payload) => {
    return apiClient.post('/api/v1/shifts/payroll/cycles', payload)
}

export const updatePayrollCycle = (id, payload) => {
    return apiClient.put(`/api/v1/shifts/payroll/cycles/${id}`, payload)
}

export const regeneratePayrollCycle = (id) => {
    return apiClient.post(`/api/v1/shifts/payroll/cycles/${id}/regenerate`)
}

export const getPayrollSummaries = (params = {}) => {
    return apiClient.get('/api/v1/shifts/payroll/summaries', { params })
}
