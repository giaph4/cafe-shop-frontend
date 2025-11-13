import apiClient from './axios'

export const getAdminDashboard = (params = {}) => {
    return apiClient.get('/api/admin/dashboard', { params })
}

export const getManagerDashboard = (params = {}) => {
    return apiClient.get('/api/manager/dashboard', { params })
}

export const getStaffDashboard = (params = {}) => {
    return apiClient.get('/api/staff/dashboard', { params })
}

export const getStaffDashboardByUserId = (userId, params = {}) => {
    if (!userId) {
        throw new Error('userId is required to fetch staff dashboard by user')
    }
    return apiClient.get(`/api/staff/dashboard/${userId}`, { params })
}
