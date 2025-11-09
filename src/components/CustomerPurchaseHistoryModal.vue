<template>
    <el-dialog
        :model-value="visible"
        class="purchase-history-dialog"
        width="90%"
        top="40px"
        :close-on-click-modal="false"
        destroy-on-close
        append-to-body
        @close="handleClose"
    >
        <template #header>
            <div class="dialog-header">
                <div v-if="customerInfo" class="header-avatar">
                    <span>{{ customerInitials }}</span>
                </div>
                <div>
                    <h2 class="dialog-title">Lịch sử mua hàng</h2>
                    <p v-if="customerInfo" class="dialog-subtitle">
                        {{ customerInfo.name }} · {{ customerInfo.phone || 'Chưa có SĐT' }} · ID: {{ customerInfo.id }}
                    </p>
                </div>
            </div>
        </template>

        <div class="history-body" v-loading="loading">
            <el-alert
                v-if="errorMessage"
                type="error"
                :closable="false"
                class="mb-3"
                :title="errorMessage"
            />

            <div v-if="summaryStats.totalOrders > 0" class="summary-grid mb-4">
                <div class="summary-card">
                    <span class="summary-label">Tổng số đơn</span>
                    <span class="summary-value">{{ summaryStats.totalOrders }}</span>
                </div>
                <div class="summary-card">
                    <span class="summary-label">Tổng doanh thu</span>
                    <span class="summary-value">{{ formatCurrency(summaryStats.totalAmount) }}</span>
                </div>
                <div class="summary-card">
                    <span class="summary-label">Giá trị trung bình</span>
                    <span class="summary-value">{{ formatCurrency(summaryStats.averageOrderValue) }}</span>
                </div>
                <div class="summary-card">
                    <span class="summary-label">Giao dịch gần nhất</span>
                    <span class="summary-value">{{ formatDateTime(summaryStats.lastPurchaseDate) }}</span>
                </div>
            </div>

            <el-card
                v-if="isLocalFilterActive && filteredOrders.length > 0"
                class="filtered-summary mb-3"
                shadow="never"
            >
                <div class="filtered-summary-grid">
                    <div class="filtered-summary-item">
                        <span class="filtered-summary-label">Đơn phù hợp bộ lọc</span>
                        <span class="filtered-summary-value">{{ filteredSummary.totalOrders }}</span>
                    </div>
                    <div class="filtered-summary-item">
                        <span class="filtered-summary-label">Tổng tiền theo bộ lọc</span>
                        <span class="filtered-summary-value">{{ formatCurrency(filteredSummary.totalAmount) }}</span>
                    </div>
                    <div class="filtered-summary-item">
                        <span class="filtered-summary-label">Giá trị trung bình</span>
                        <span class="filtered-summary-value">{{ formatCurrency(filteredSummary.averageOrderValue) }}</span>
                    </div>
                </div>
            </el-card>

            <template v-if="!loading">
                <el-empty
                    v-if="summaryStats.totalOrders > 0 && filteredOrders.length === 0"
                    description="Không có đơn nào phù hợp bộ lọc hiện tại"
                />
                <el-empty
                    v-else-if="summaryStats.totalOrders === 0"
                    description="Chưa có dữ liệu theo tiêu chí lọc"
                />
            </template>

            <el-card class="filters-card mb-4" shadow="never">
                <template #header>
                    <div class="filters-header">
                        <h3>Bộ lọc</h3>
                        <el-button type="primary" text @click="resetLocalFilters">Đặt lại</el-button>
                    </div>
                </template>
                <el-form :model="filters" label-position="top" class="filters-form" inline>
                    <el-form-item label="Khoảng ngày">
                        <el-date-picker
                            v-model="filters.dateRange"
                            type="daterange"
                            unlink-panels
                            range-separator="đến"
                            start-placeholder="Từ ngày"
                            end-placeholder="Đến ngày"
                            format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD"
                            @change="handleDateRangeChange"
                        />
                    </el-form-item>

                    <el-form-item label="Trạng thái hóa đơn">
                        <el-select v-model="filters.status" placeholder="Chọn trạng thái" clearable
                                   @change="handleStatusChange">
                            <el-option
                                v-for="option in statusOptions"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                            />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Phương thức thanh toán">
                        <el-select v-model="filters.paymentMethod" placeholder="Tất cả" clearable
                                   @change="handleLocalFilterChange">
                            <el-option
                                v-for="option in paymentOptions"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                            />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Giá trị tối thiểu (VNĐ)">
                        <el-input-number
                            v-model="filters.minTotal"
                            :min="0"
                            :step="10000"
                            :precision="0"
                            controls-position="right"
                            @change="handleLocalFilterChange"
                        />
                    </el-form-item>

                    <el-form-item label="Giá trị tối đa (VNĐ)">
                        <el-input-number
                            v-model="filters.maxTotal"
                            :min="0"
                            :step="10000"
                            :precision="0"
                            controls-position="right"
                            @change="handleLocalFilterChange"
                        />
                    </el-form-item>
                </el-form>
            </el-card>

            <EasyDataTable
                v-if="filteredOrders.length > 0"
                :headers="headers"
                :items="paginatedOrders"
                :loading="loading"
                v-model:server-options="tableServerOptions"
                :server-items-length="filteredOrders.length"
                table-class-name="history-table"
                theme-color="#8B7355"
                buttons-pagination
                show-index
            >
                <template #item-status="{ status }">
                    <StatusBadge :status="status || 'N/A'"/>
                </template>

                <template #item-type="{ type }">
                    <el-tag size="small" type="info">{{ type || 'N/A' }}</el-tag>
                </template>

                <template #item-paymentMethod="{ paymentMethod }">
                    <StatusBadge :status="paymentMethod || 'N/A'"/>
                </template>

                <template #item-subTotal="{ subTotal }">
                    {{ formatCurrency(subTotal) }}
                </template>

                <template #item-discountAmount="{ discountAmount }">
                    {{ formatCurrency(discountAmount) }}
                </template>

                <template #item-totalAmount="{ totalAmount }">
                    <span class="total-amount">{{ formatCurrency(totalAmount) }}</span>
                </template>

                <template #item-createdAt="{ createdAt }">
                    {{ formatDateTime(createdAt) }}
                </template>

                <template #item-paidAt="{ paidAt }">
                    {{ formatDateTime(paidAt) }}
                </template>

                <template #item-staffUsername="{ staffUsername }">
                    <el-tag size="small" type="primary">{{ staffUsername || 'N/A' }}</el-tag>
                </template>

                <template #item-tableName="{ tableName }">
                    <el-tag size="small" type="success">{{ tableName || 'Mang đi' }}</el-tag>
                </template>

                <template #item-orderDetails="{ orderDetails }">
                    <el-popover placement="left" width="360" trigger="click">
                        <template #reference>
                            <button class="btn-gradient" link size="small">Xem</button>
                        </template>
                        <div class="order-details">
                            <h4>Chi tiết sản phẩm</h4>
                            <el-scrollbar height="240px">
                                <div
                                    v-for="detail in orderDetails"
                                    :key="detail.id"
                                    class="order-detail-item"
                                >
                                    <div class="detail-header">
                                        <span class="detail-name">{{ detail.productName }}</span>
                                        <span class="detail-qty">x{{ detail.quantity }}</span>
                                    </div>
                                    <div class="detail-meta">
                                        <span>{{ formatCurrency(detail.priceAtOrder) }}</span>
                                        <span v-if="detail.notes" class="detail-notes">Ghi chú: {{
                                                detail.notes
                                            }}</span>
                                    </div>
                                </div>
                            </el-scrollbar>
                        </div>
                    </el-popover>
                </template>

                <template #expand="{ orderDetails }">
                    <div class="expand-section">
                        <h4>Chi tiết sản phẩm</h4>
                        <div class="expand-details">
                            <div
                                v-for="detail in orderDetails"
                                :key="detail.id"
                                class="expand-detail-item"
                            >
                                <div class="detail-name">{{ detail.productName }}</div>
                                <div class="detail-info">
                                    <span>Số lượng: {{ detail.quantity }}</span>
                                    <span>Đơn giá: {{ formatCurrency(detail.priceAtOrder) }}</span>
                                    <span v-if="detail.notes">Ghi chú: {{ detail.notes }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </EasyDataTable>

            <div v-if="filteredOrders.length > 0" class="data-footer">
                <div class="footer-summary">
                    <span>Hiển thị {{ pageSummary.from }} - {{ pageSummary.to }} / {{ filteredOrders.length }} đơn theo bộ lọc</span>
                    <span>Tổng số đơn (tất cả): {{ summaryStats.totalOrders }}</span>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-pagination
                    layout="prev, pager, next, sizes, jumper"
                    :page-sizes="[5, 10, 20, 50]"
                    :page-size="tableServerOptions.rowsPerPage"
                    :current-page="tableServerOptions.page"
                    :total="filteredOrders.length"
                    @size-change="handlePageSizeChange"
                    @current-change="handlePageChange"
                />
                <el-button @click="emit('update:visible', false)">Đóng</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import { ElMessage } from 'element-plus'
import 'vue3-easy-data-table/dist/style.css'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatCurrency } from '@/utils/formatters'
import { getCustomerPurchaseHistory } from '@/api/customerService'

const FETCH_PAGE_SIZE = 50

const props = defineProps({
    visible: { type: Boolean, default: false },
    customerId: { type: Number, required: true }
})

const emit = defineEmits(['update:visible'])

const loading = ref(false)
const errorMessage = ref('')
const customerInfo = ref(null)
const orders = ref([])

const summaryStats = reactive({
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    lastPurchaseDate: null
})

const tableServerOptions = reactive({
    page: 1,
    rowsPerPage: 5,
    sortBy: 'createdAt',
    sortType: 'desc'
})

const filters = reactive({
    dateRange: null,
    status: null,
    paymentMethod: null,
    minTotal: null,
    maxTotal: null
})

const statusOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Đang chờ', value: 'PENDING' },
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Hoàn thành', value: 'COMPLETED' }
]

const paymentOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Tiền mặt', value: 'CASH' },
    { label: 'Chuyển khoản', value: 'TRANSFER' },
    { label: 'Thẻ', value: 'CARD' }
]

const headers = [
    { text: 'Mã đơn', value: 'orderId', sortable: true, width: 20 },
    { text: 'Trạng thái', value: 'status', sortable: true, width: 60 },
    { text: 'Loại đơn', value: 'type', width: 60 },
    { text: 'Phương thức thanh toán', value: 'paymentMethod', width: 60 },
    { text: 'Bàn', value: 'tableName', width: 70 },
    { text: 'Nhân viên', value: 'staffUsername', width: 100 },
    { text: 'Ngày tạo', value: 'createdAt', sortable: true, width: 60 },
    { text: 'Ngày thanh toán', value: 'paidAt', sortable: true, width: 60 },
    { text: 'Tạm tính', value: 'subTotal', sortable: true, width: 120 },
    { text: 'Giảm giá', value: 'discountAmount', sortable: true, width: 120 },
    { text: 'Tổng tiền', value: 'totalAmount', sortable: true, width: 130 },
    { text: 'Chi tiết sản phẩm', value: 'orderDetails', width: 100 }
]

const customerInitials = computed(() => {
    if (!customerInfo.value?.name) return 'KH'
    return customerInfo.value.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
})

const isLocalFilterActive = computed(() =>
    Boolean(
        filters.paymentMethod ||
        filters.minTotal !== null ||
        filters.maxTotal !== null
    )
)

const filteredOrders = computed(() => {
    let result = orders.value.slice()

    if (filters.paymentMethod) {
        result = result.filter((order) => order.paymentMethod === filters.paymentMethod)
    }
    if (filters.minTotal !== null) {
        result = result.filter((order) => Number(order.totalAmount || 0) >= filters.minTotal)
    }
    if (filters.maxTotal !== null) {
        result = result.filter((order) => Number(order.totalAmount || 0) <= filters.maxTotal)
    }

    const sortBy = tableServerOptions.sortBy
    if (sortBy) {
        const sortType = tableServerOptions.sortType || 'asc'
        const sorted = [...result].sort((a, b) => {
            const valueA = a?.[sortBy]
            const valueB = b?.[sortBy]

            if (valueA === valueB) return 0
            if (valueA === undefined || valueA === null) return -1
            if (valueB === undefined || valueB === null) return 1

            if (sortBy === 'createdAt' || sortBy === 'paidAt') {
                return new Date(valueA).getTime() - new Date(valueB).getTime()
            }

            const numA = Number(valueA)
            const numB = Number(valueB)
            if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
                return numA - numB
            }

            return String(valueA).localeCompare(String(valueB), 'vi', { sensitivity: 'base' })
        })

        result = sortType === 'desc' ? sorted.reverse() : sorted
    }

    return result
})

const paginatedOrders = computed(() => {
    const start = (tableServerOptions.page - 1) * tableServerOptions.rowsPerPage
    return filteredOrders.value.slice(start, start + tableServerOptions.rowsPerPage)
})

const pageSummary = computed(() => {
    if (filteredOrders.value.length === 0) {
        return { from: 0, to: 0 }
    }
    const from = (tableServerOptions.page - 1) * tableServerOptions.rowsPerPage + 1
    const to = Math.min(filteredOrders.value.length, from + tableServerOptions.rowsPerPage - 1)
    return { from, to }
})

const filteredSummary = computed(() => {
    const totalOrders = filteredOrders.value.length
    if (totalOrders === 0) {
        return {
            totalOrders: 0,
            totalAmount: 0,
            averageOrderValue: 0
        }
    }
    const totalAmount = filteredOrders.value.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    const averageOrderValue = totalAmount / totalOrders
    return {
        totalOrders,
        totalAmount,
        averageOrderValue
    }
})

watch(
    () => tableServerOptions.rowsPerPage,
    () => {
        tableServerOptions.page = 1
    }
)

watch(
    () => [tableServerOptions.sortBy, tableServerOptions.sortType],
    () => {
        tableServerOptions.page = 1
    }
)

watch(
    () => filteredOrders.value.length,
    () => {
        const maxPage = Math.max(1, Math.ceil(filteredOrders.value.length / tableServerOptions.rowsPerPage || 1))
        if (tableServerOptions.page > maxPage) {
            tableServerOptions.page = maxPage
        }
    }
)

const buildRequestParams = (page = 0) => {
    const params = {
        page,
        size: FETCH_PAGE_SIZE,
        sort: 'createdAt,desc'
    }
    if (filters.dateRange?.length === 2) {
        params.startDate = filters.dateRange[0]
        params.endDate = filters.dateRange[1]
    }
    if (filters.status) {
        params.status = filters.status
    }
    return params
}

const fetchData = async () => {
    if (!props.customerId) return
    loading.value = true
    errorMessage.value = ''
    orders.value = []

    const allOrders = []
    let currentPage = 0
    const maxIterations = 50

    try {
        while (currentPage < maxIterations) {
            const response = await getCustomerPurchaseHistory(props.customerId, buildRequestParams(currentPage))
            const data = response.data

            if (currentPage === 0) {
                customerInfo.value = {
                    id: data.customerId,
                    name: data.customerName,
                    phone: data.customerPhone
                }
                summaryStats.totalOrders = data.totalOrders || 0
                summaryStats.totalAmount = data.totalAmount || 0
                summaryStats.averageOrderValue = data.averageOrderValue || 0
                summaryStats.lastPurchaseDate = data.lastPurchaseDate || null
            }

            allOrders.push(...(data.orders || []))

            const totalPages = data.totalPages ?? currentPage + 1
            const hasNext = data.hasNext ?? currentPage + 1 < totalPages

            if (!hasNext) {
                break
            }

            currentPage += 1
        }

        orders.value = allOrders
        tableServerOptions.page = 1
    } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Không thể tải lịch sử mua hàng.'
        ElMessage.error(errorMessage.value)
    } finally {
        loading.value = false
    }
}

watch(
    () => props.visible,
    (isVisible) => {
        if (isVisible) {
            fetchData()
        }
    },
    { immediate: true }
)

watch(
    () => props.customerId,
    (newId, oldId) => {
        if (props.visible && newId && newId !== oldId) {
            fetchData()
        }
    }
)

const handleDateRangeChange = () => {
    tableServerOptions.page = 1
    fetchData()
}

const handleStatusChange = () => {
    tableServerOptions.page = 1
    fetchData()
}

const handleLocalFilterChange = () => {
    tableServerOptions.page = 1
}

const handlePageSizeChange = (size) => {
    tableServerOptions.rowsPerPage = size
}

const handlePageChange = (page) => {
    tableServerOptions.page = page
}

const formatDateTime = (value) => {
    if (!value) return 'N/A'
    return new Date(value).toLocaleString('vi-VN', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const resetLocalFilters = () => {
    filters.dateRange = null
    filters.status = null
    filters.paymentMethod = null
    filters.minTotal = null
    filters.maxTotal = null
    tableServerOptions.page = 1
    fetchData()
}

const handleClose = () => {
    emit('update:visible', false)
    orders.value = []
    errorMessage.value = ''
    filters.dateRange = null
    filters.status = null
    filters.paymentMethod = null
    filters.minTotal = null
    filters.maxTotal = null
    tableServerOptions.page = 1
    tableServerOptions.rowsPerPage = 5
    tableServerOptions.sortBy = 'createdAt'
    tableServerOptions.sortType = 'desc'
}
</script>

<style scoped>
.purchase-history-dialog :deep(.el-dialog__header) {
    border-bottom: 1px solid var(--el-border-color-light);
    padding-bottom: 12px;
}

.dialog-header {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.2rem;
}

.dialog-title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
}

.dialog-subtitle {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
}

.history-body {
    min-height: 400px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.summary-card {
    background: var(--el-color-primary-light-9);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.summary-label {
    color: var(--el-text-color-secondary);
    font-size: 0.85rem;
}

.summary-value {
    font-weight: 600;
    font-size: 1.2rem;
}

.filters-card {
    border-radius: 12px;
}

.filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.filters-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
}

.history-table {
    --easy-table-header-font-weight: 600;
    --easy-table-header-font-size: 14px;
    --easy-table-body-row-font-size: 13px;
}

.total-amount {
    font-weight: 600;
    color: var(--el-color-primary);
}

.order-details {
    padding: 8px 0;
}

.order-details h4 {
    margin: 0 0 8px;
    font-weight: 600;
}

.order-detail-item {
    padding: 8px 0;
    border-bottom: 1px dashed var(--el-border-color-light);
}

.order-detail-item:last-child {
    border-bottom: none;
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.detail-name {
    font-weight: 600;
}

.detail-qty {
    color: var(--el-text-color-secondary);
}

.detail-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.85rem;
}

.detail-notes {
    color: var(--el-color-warning);
}

.expand-section {
    padding: 16px;
    background: #fafafa;
    border-radius: 12px;
}

.expand-section h4 {
    margin-top: 0;
}

.expand-details {
    display: grid;
    gap: 12px;
}

.expand-detail-item {
    padding: 12px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.detail-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
}

.data-footer {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 0;
    border-top: 1px solid var(--el-border-color-light);
}

.mb-3 {
    margin-bottom: 16px;
}

.mb-4 {
    margin-bottom: 24px;
}
</style>
