import apiClient from './axios'

export const fetchDashboardMetrics = (params) => {
    return apiClient.get('/api/admin/analytics/metrics', {
        params: {
            includeTopProducts: true,
            includeVoucherStats: true,
            includeCustomerStats: true,
            ...params,
        },
    })
}

export const generateDashboardInsight = (payload) => {
    return apiClient.post('/api/admin/analytics/insight', payload)
}
