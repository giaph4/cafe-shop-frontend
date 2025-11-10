// src/api/loginHistoryService.js
import apiClient from './axios'

/**
 * Lấy lịch sử đăng nhập với bộ lọc và phân trang
 * @param {object} params { page, size, sort, username, success, startDate, endDate }
 */
export const getLoginHistory = (params) => {
    return apiClient.get('/api/v1/login-history', { params })
}
