export const SHIFT_STATUS_OPTIONS = [
    { value: 'PLANNED', label: 'Dự kiến', type: 'info' },
    { value: 'LOCKED', label: 'Đã khóa', type: 'warning' },
    { value: 'IN_PROGRESS', label: 'Đang diễn ra', type: 'primary' },
    { value: 'DONE', label: 'Hoàn tất', type: 'success' },
    { value: 'CANCELLED', label: 'Đã hủy', type: 'danger' }
]

export const SHIFT_ASSIGNMENT_STATUS_OPTIONS = [
    { value: 'SCHEDULED', label: 'Chờ xác nhận', type: 'info' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', type: 'primary' },
    { value: 'IN_PROGRESS', label: 'Đang làm', type: 'warning' },
    { value: 'COMPLETED', label: 'Hoàn tất', type: 'success' },
    { value: 'CANCELLED', label: 'Đã hủy', type: 'danger' }
]

export const ATTENDANCE_SOURCE_OPTIONS = [
    { value: 'QR', label: 'QR Code' },
    { value: 'APP', label: 'Ứng dụng' },
    { value: 'WEB', label: 'Web' },
    { value: 'MANUAL', label: 'Thủ công' }
]

export const ADJUSTMENT_TYPE_OPTIONS = [
    { value: 'BONUS', label: 'Thưởng', type: 'success' },
    { value: 'PENALTY', label: 'Phạt', type: 'danger' }
]

export const DEFAULT_PAGINATION = {
    page: 1,
    rowsPerPage: 10,
    sortBy: 'createdAt',
    sortType: 'desc'
}

export const ROLE_COLOR_MAP = {
    ADMIN: '#f56c6c',
    MANAGER: '#e6a23c',
    BARISTA: '#67c23a',
    CASHIER: '#409EFF',
    STAFF: '#909399'
}

export const SHIFT_SORTING_OPTIONS = [
    { label: 'Ngày ca (mới nhất)', value: 'shiftDate,desc' },
    { label: 'Ngày ca (cũ nhất)', value: 'shiftDate,asc' },
    { label: 'Trạng thái', value: 'status,asc' },
    { label: 'Cập nhật gần nhất', value: 'updatedAt,desc' }
]
