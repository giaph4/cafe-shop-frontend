import apiClient from './axios'

// ===== Shift Templates =====
export const getShiftTemplates = (params) => {
    return apiClient.get('/api/v1/shifts/templates', { params })
}

export const getShiftTemplateById = (id) => {
    return apiClient.get(`/api/v1/shifts/templates/${id}`)
}

export const createShiftTemplate = (payload) => {
    return apiClient.post('/api/v1/shifts/templates', payload)
}

export const updateShiftTemplate = (id, payload) => {
    return apiClient.put(`/api/v1/shifts/templates/${id}`, payload)
}

export const deleteShiftTemplate = (id) => {
    return apiClient.delete(`/api/v1/shifts/templates/${id}`)
}

// ===== Shift Instances =====
export const getShiftInstances = (params) => {
    return apiClient.get('/api/v1/shifts/instances', { params })
}

export const getShiftInstanceById = (id) => {
    return apiClient.get(`/api/v1/shifts/instances/${id}`)
}

export const createShiftInstances = (payload) => {
    return apiClient.post('/api/v1/shifts/instances', payload)
}

export const updateShiftInstance = (id, payload) => {
    return apiClient.put(`/api/v1/shifts/instances/${id}`, payload)
}

export const updateShiftInstanceStatus = (id, payload) => {
    return apiClient.patch(`/api/v1/shifts/instances/${id}/status`, payload)
}

export const deleteShiftInstance = (id) => {
    return apiClient.delete(`/api/v1/shifts/instances/${id}`)
}

// ===== Shift Assignments =====
export const getShiftAssignmentById = (assignmentId) => {
    return apiClient.get(`/api/v1/shifts/assignments/${assignmentId}`)
}

export const getAssignmentsByShift = (shiftId) => {
    return apiClient.get(`/api/v1/shifts/assignments/shift/${shiftId}`)
}

export const createShiftAssignment = (payload) => {
    return apiClient.post('/api/v1/shifts/assignments', payload)
}

export const updateShiftAssignment = (assignmentId, payload) => {
    return apiClient.put(`/api/v1/shifts/assignments/${assignmentId}`, payload)
}

export const updateShiftAssignmentStatus = (assignmentId, payload) => {
    return apiClient.patch(`/api/v1/shifts/assignments/${assignmentId}/status`, payload)
}

export const deleteShiftAssignment = (assignmentId) => {
    return apiClient.delete(`/api/v1/shifts/assignments/${assignmentId}`)
}

// ===== Attendance =====
export const checkInAttendance = (payload) => {
    return apiClient.post('/api/v1/attendance/check-in', payload)
}

export const checkOutAttendance = (payload) => {
    return apiClient.post('/api/v1/attendance/check-out', payload)
}

export const getAttendanceByAssignment = (assignmentId) => {
    return apiClient.get(`/api/v1/attendance/assignment/${assignmentId}`)
}

export const getAttendanceByShift = (shiftId) => {
    return apiClient.get(`/api/v1/attendance/shift/${shiftId}`)
}

// ===== Performance Adjustments =====
export const getShiftAdjustmentById = (id) => {
    return apiClient.get(`/api/v1/shifts/adjustments/${id}`)
}

export const getAdjustmentsByAssignment = (assignmentId) => {
    return apiClient.get(`/api/v1/shifts/adjustments/assignment/${assignmentId}`)
}

export const createShiftAdjustment = (payload) => {
    return apiClient.post('/api/v1/shifts/adjustments', payload)
}

export const revokeShiftAdjustment = (id, payload) => {
    return apiClient.post(`/api/v1/shifts/adjustments/${id}/revoke`, payload)
}

export const deleteShiftAdjustment = (id) => {
    return apiClient.delete(`/api/v1/shifts/adjustments/${id}`)
}
