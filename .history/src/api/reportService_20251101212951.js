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