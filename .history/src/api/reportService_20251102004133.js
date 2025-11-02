// src/api/reportService.js
import apiClient from './axios.js'

// ... (Các hàm getProfitReport, getRevenueByDateRange, getBestSellers, getExpensesByDateRange đã tồn tại) ...

// (Các hàm đã có từ Bước 3)
export const getProfitReport = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/profit', {
        params: { startDate, endDate },
    })
}
export const getRevenueByDateRange = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/revenue-by-date', {
        params: { startDate, endDate },
    })
}
export const getBestSellers = (startDate, endDate, top = 5, sortBy = 'revenue') => {
    return apiClient.get('/api/v1/reports/best-sellers', {
        params: { startDate, endDate, top, sortBy },
    })
}
export const getExpensesByDateRange = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/expenses-by-date', {
        params: { startDate, endDate },
    })
}

// --- (THÊM 2 HÀM MỚI DƯỚI ĐÂY) ---

/**
 * [MỚI] Lấy báo cáo tồn kho (tất cả hoặc sắp hết)
 * @param {boolean} lowStock - true (chỉ lấy hàng sắp hết), false (lấy tất cả)
 */
export const getInventoryReport = (lowStock = false) => {
    return apiClient.get('/api/v1/reports/inventory', {
        params: { lowStock }
    })
}

/**
 * [MỚI] Xuất file Excel danh sách đơn hàng
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const exportOrdersToExcel = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/orders/export', {
        params: { startDate, endDate },
        responseType: 'blob' // !! Quan trọng: Yêu cầu Axios trả về dạng file Blob
    })
}