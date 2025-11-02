// src/api/expenseService.js
import apiClient from './axios'

/**
 * Lấy danh sách chi phí (phân trang, lọc theo ngày)
 * @param {object} params - { page, size, startDate, endDate, sort }
 */
export const getExpenses = (params) => {
    return apiClient.get('/api/v1/expenses', { params })
}

/**
 * Tạo chi phí mới
 * @param {object} expenseData - ExpenseDTO
 */
export const createExpense = (expenseData) => {
    return apiClient.post('/api/v1/expenses', expenseData)
}

/**
 * Cập nhật thông tin chi phí
 * @param {number} id - ID chi phí
 * @param {object} expenseData - ExpenseDTO
 */
export const updateExpense = (id, expenseData) => {
    return apiClient.put(`/api/v1/expenses/${id}`, expenseData)
}

/**
 * Xóa chi phí (Chỉ Admin)
 * @param {number} id - ID chi phí
 */
export const deleteExpense = (id) => {
    return apiClient.delete(`/api/v1/expenses/${id}`)
}