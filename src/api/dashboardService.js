import apiClient from './axios'

const DASHBOARD_BASE_URL = '/api'

const normalizeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    )

const get = (path, params) => apiClient.get(`${DASHBOARD_BASE_URL}${path}`, {params: normalizeParams(params)})

export const getAdminDashboard = (params = {}) => get('/admin/dashboard', params)

export const getManagerDashboard = (params = {}) => get('/manager/dashboard', params)

export const getStaffDashboard = (params = {}) => get('/staff/dashboard', params)

export const getStaffDashboardByUserId = (userId, params = {}) => {
    if (!userId) {
        throw new Error('userId is required to fetch staff dashboard by user')
    }
    return get(`/staff/dashboard/${userId}`, params)
}
