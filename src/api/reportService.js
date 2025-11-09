// src/api/reportService.js
import apiClient from './axios'

/**
 * Lấy báo cáo Lợi nhuận (Revenue, COGS, Profit)
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const getProfitReport = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/profit', {
        params: { startDate, endDate },
    })
}

/**
 * Lấy báo cáo Doanh thu theo từng ngày (cho Line Chart)
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const getRevenueByDateRange = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/revenue-by-date', {
        params: { startDate, endDate },
    })
}

/**
 * Lấy Top Sản phẩm Bán chạy (cho Bar Chart)
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 * @param {number} top - Số lượng top
 * @param {string} sortBy - 'quantity' hoặc 'revenue'
 */
export const getBestSellers = (startDate, endDate, top = 5, sortBy = 'revenue') => {
    return apiClient.get('/api/v1/reports/best-sellers', {
        params: { startDate, endDate, top, sortBy },
    })
}

/**
 * Lấy báo cáo Chi phí theo ngày và loại (cho Pie Chart)
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const getExpensesByDateRange = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/expenses-by-date', {
        params: { startDate, endDate },
    })
}

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

/**
 * Lấy Top Khách hàng (theo doanh thu)
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 * @param {number} top - Số lượng top (default: 10)
 */
export const getTopCustomers = (startDate, endDate, top = 10) => {
    return apiClient.get('/api/v1/reports/top-customers', {
        params: { startDate, endDate, top }
    })
}

/**
 * Lấy Hiệu suất Nhân viên
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 * @param {number} top - Số lượng top (default: 10)
 */
export const getStaffPerformance = (startDate, endDate, top = 10) => {
    return apiClient.get('/api/v1/reports/staff-performance', {
        params: { startDate, endDate, top }
    })
}

/**
 * Lấy Doanh thu theo Danh mục
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const getCategorySales = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/category-sales', {
        params: { startDate, endDate }
    })
}

/**
 * Lấy Doanh thu theo Giờ (24 giờ)
 * @param {string} date - "YYYY-MM-DD"
 */
export const getHourlySales = (date) => {
    return apiClient.get('/api/v1/reports/hourly-sales', {
        params: { date }
    })
}

/**
 * Lấy Thống kê Phương thức Thanh toán
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const getPaymentMethodStats = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/payment-method-stats', {
        params: { startDate, endDate }
    })
}

/**
 * Lấy tổng chi phí vận hành trong khoảng ngày
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const getTotalExpenses = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/total-expenses', {
        params: { startDate, endDate }
    })
}

/**
 * Lấy tổng chi phí nhập nguyên liệu đã hoàn tất trong khoảng ngày
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const getTotalImportedIngredientCost = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/total-imported-ingredients', {
        params: { startDate, endDate }
    })
}

/**
 * So sánh Doanh thu 2 kỳ
 * @param {string} currentStart - "YYYY-MM-DD"
 * @param {string} currentEnd - "YYYY-MM-DD"
 * @param {string} previousStart - "YYYY-MM-DD"
 * @param {string} previousEnd - "YYYY-MM-DD"
 */
export const getSalesComparison = (currentStart, currentEnd, previousStart, previousEnd) => {
    return apiClient.get('/api/v1/reports/sales-comparison', {
        params: { currentStart, currentEnd, previousStart, previousEnd }
    })
}

/**
 * Lấy Doanh thu theo Ngày (single day)
 * @param {string} date - "YYYY-MM-DD"
 */
export const getDailyRevenue = (date) => {
    return apiClient.get('/api/v1/reports/daily-revenue', {
        params: { date }
    })
}

/**
 * Xuất file Excel Tồn kho
 */
export const exportInventoryToExcel = () => {
    return apiClient.get('/api/v1/reports/inventory/export', {
        responseType: 'blob'
    })
}

/**
 * Xuất file Excel Chi phí
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 */
export const exportExpensesToExcel = (startDate, endDate) => {
    return apiClient.get('/api/v1/reports/expenses/export', {
        params: { startDate, endDate },
        responseType: 'blob'
    })
}
