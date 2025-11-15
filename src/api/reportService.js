import apiClient from './axios'

const REPORTS_BASE_URL = '/api/v1/reports'

const normalizeParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
    )

const buildConfig = (params, config = {}) => ({
    params: normalizeParams(params),
    ...config,
})

const get = (path = '', params, config) =>
    apiClient.get(`${REPORTS_BASE_URL}${path}`, buildConfig(params, config))

export const getProfitReport = (startDate, endDate) =>
    get('/profit', { startDate, endDate })

export const getRevenueByDateRange = (startDate, endDate) =>
    get('/revenue-by-date', { startDate, endDate })

export const getBestSellers = (startDate, endDate, top = 5, sortBy = 'revenue') =>
    get('/best-sellers', { startDate, endDate, top, sortBy })

export const getExpensesByDateRange = (startDate, endDate) =>
    get('/expenses-by-date', { startDate, endDate })

export const getInventoryReport = (lowStock = false) =>
    get('/inventory', { lowStock })

export const exportOrdersToExcel = (startDate, endDate) =>
    get('/orders/export', { startDate, endDate }, { responseType: 'blob' })

export const getTopCustomers = (startDate, endDate, top = 10) =>
    get('/top-customers', { startDate, endDate, top })

export const getStaffPerformance = (startDate, endDate, top = 10) =>
    get('/staff-performance', { startDate, endDate, top })

export const getCategorySales = (startDate, endDate) =>
    get('/category-sales', { startDate, endDate })

export const getProductSalesSummary = (startDate, endDate) =>
    get('/product-sales-summary', { startDate, endDate })

export const getHourlySales = (date) =>
    get('/hourly-sales', { date })

export const getPaymentMethodStats = (startDate, endDate) =>
    get('/payment-method-stats', { startDate, endDate })

export const getTotalExpenses = (startDate, endDate) =>
    get('/total-expenses', { startDate, endDate })

export const getTotalImportedIngredientCost = (startDate, endDate) =>
    get('/total-imported-ingredients', { startDate, endDate })

export const getSalesComparison = (currentStart, currentEnd, previousStart, previousEnd) =>
    get('/sales-comparison', { currentStart, currentEnd, previousStart, previousEnd })

export const getDailyRevenue = (date) =>
    get('/daily-revenue', { date })

export const exportInventoryToExcel = () =>
    get('/inventory/export', undefined, { responseType: 'blob' })

export const exportExpensesToExcel = (startDate, endDate) =>
    get('/expenses/export', { startDate, endDate }, { responseType: 'blob' })
