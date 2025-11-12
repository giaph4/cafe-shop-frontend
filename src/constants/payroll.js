export const PAYROLL_CYCLE_STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Nháp', type: 'info' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý', type: 'warning' },
    { value: 'READY_FOR_APPROVAL', label: 'Chờ duyệt', type: 'primary' },
    { value: 'APPROVED', label: 'Đã duyệt', type: 'success' },
    { value: 'CLOSED', label: 'Đã khóa', type: 'danger' }
]

export const PAYROLL_CYCLE_STATUS_TAG_MAP = {
    DRAFT: { type: 'info', label: 'Nháp' },
    IN_PROGRESS: { type: 'warning', label: 'Đang xử lý' },
    READY_FOR_APPROVAL: { type: 'primary', label: 'Chờ duyệt' },
    APPROVED: { type: 'success', label: 'Đã duyệt' },
    CLOSED: { type: 'danger', label: 'Đã khóa' }
}

export const ATTENDANCE_SOURCE_OPTIONS = [
    { value: 'QR', label: 'Điểm danh QR' },
    { value: 'APP', label: 'Ứng dụng' },
    { value: 'WEB', label: 'Web' },
    { value: 'MANUAL', label: 'Thủ công' }
]

export const ADJUSTMENT_TYPE_MAP = {
    BONUS: { label: 'Thưởng', type: 'success' },
    PENALTY: { label: 'Phạt', type: 'danger' }
}
