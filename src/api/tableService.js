// src/api/tableService.js
import apiClient from './axios'

/**
 * Lấy TẤT CẢ các bàn (API không phân trang)
 */
export const getAllTables = () => {
    return apiClient.get('/api/v1/tables')
}

/**
 * Tạo bàn mới
 * @param {object} tableData - { name, capacity }
 */
export const createTable = (tableData) => {
    return apiClient.post('/api/v1/tables', tableData)
}

/**
 * Cập nhật thông tin bàn (Tên, Sức chứa)
 * @param {number} id - ID bàn
 * @param {object} tableData - { name, capacity }
 */
export const updateTable = (id, tableData) => {
    return apiClient.put(`/api/v1/tables/${id}`, tableData)
}

/**
 * Cập nhật TRẠNG THÁI bàn (EMPTY, SERVING, RESERVED)
 * @param {number} id - ID bàn
 * @param {string} status - Trạng thái mới
 */
export const updateTableStatus = (id, status) => {
    // API yêu cầu gửi về dạng {"status": "SERVING"}
    return apiClient.patch(`/api/v1/tables/${id}/status`, { status })
}

/**
 * Xóa bàn
 * @param {number} id - ID bàn
 */
export const deleteTable = (id) => {
    return apiClient.delete(`/api/v1/tables/${id}`)
}
