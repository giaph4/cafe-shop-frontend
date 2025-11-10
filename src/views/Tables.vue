<template>
    <div class="app-page-container custom-height animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <h1 class="page-title">Quản lý Bàn</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus/>
                </el-icon>
                Thêm Bàn
            </el-button>
        </div>

        <el-card class="box-card filter-card">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-input
                        v-model="searchQuery"
                        placeholder="Tìm theo tên bàn..."
                        clearable
                    >
                        <template #prefix>
                            <el-icon>
                                <Search/>
                            </el-icon>
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="8">
                    <el-select
                        v-model="filterStatus"
                        placeholder="Lọc theo trạng thái"
                        clearable
                        class="w-100"
                    >
                        <el-option label="Tất cả trạng thái" :value="null"/>
                        <el-option label="Trống (EMPTY)" value="EMPTY"/>
                        <el-option label="Đang phục vụ (SERVING)" value="SERVING"/>
                        <el-option label="Đã đặt (RESERVED)" value="RESERVED"/>
                    </el-select>
                </el-col>
                <el-col :span="8">
                    <el-select
                        v-model="filterCapacity"
                        placeholder="Lọc theo sức chứa"
                        clearable
                        class="w-100"
                    >
                        <el-option label="Tất cả sức chứa" :value="null"/>
                        <el-option label="1-2 người" value="1-2"/>
                        <el-option label="3-4 người" value="3-4"/>
                        <el-option label="5-6 người" value="5-6"/>
                        <el-option label="7+ người" value="7+"/>
                    </el-select>
                </el-col>
            </el-row>
        </el-card>

        <div class="table-dashboard">
            <div class="table-dashboard__summary">
                <div class="summary-card total">
                    <span class="summary-card__label">Tổng số bàn</span>
                    <span class="summary-card__value">{{ statusSummary.total }}</span>
                </div>
                <div class="summary-card empty">
                    <span class="summary-card__label">Bàn trống</span>
                    <span class="summary-card__value">{{ statusSummary.EMPTY }}</span>
                </div>
                <div class="summary-card serving">
                    <span class="summary-card__label">Đang phục vụ</span>
                    <span class="summary-card__value">{{ statusSummary.SERVING }}</span>
                </div>
                <div class="summary-card reserved">
                    <span class="summary-card__label">Đã đặt</span>
                    <span class="summary-card__value">{{ statusSummary.RESERVED }}</span>
                </div>
            </div>

            <div class="table-dashboard__controls">
                <div class="quick-tags">
                    <span class="quick-tags__label">Lọc nhanh:</span>
                    <el-check-tag
                        v-for="status in quickStatusOptions"
                        :key="status.value"
                        :checked="filterStatus === status.value"
                        @change="() => handleQuickStatus(status.value)"
                    >
                        {{ status.label }}
                    </el-check-tag>
                </div>
                <div class="view-controls">
                    <el-radio-group v-model="viewMode" size="small">
                        <el-radio-button label="grid">
                            <el-icon>
                                <Grid/>
                            </el-icon>
                            Lưới
                        </el-radio-button>
                        <el-radio-button label="list">
                            <el-icon>
                                <List/>
                            </el-icon>
                            Bảng
                        </el-radio-button>
                    </el-radio-group>
                    <el-button
                        class="refresh-button"
                        size="small"
                        :loading="loading"
                        @click="fetchTables"
                    >
                        <el-icon>
                            <RefreshRight/>
                        </el-icon>
                        Tải lại
                    </el-button>
                </div>
            </div>
        </div>

        <transition name="fade" mode="out-in">
            <div v-if="viewMode === 'grid'" key="grid" class="table-grid-wrapper">
                <el-empty
                    v-if="displayTables.length === 0 && !loading"
                    description="Không có bàn nào phù hợp tiêu chí"
                />
                <div v-else class="table-grid" :class="{ 'table-grid--loading': loading }">
                    <div
                        v-for="table in displayTables"
                        :key="table.id"
                        class="table-card"
                        :class="[
                            `table-card--${table.status.toLowerCase()}`,
                            { 'table-card--pinned': isPinned(table.id) },
                            { 'table-card--cleaning': needsCleaning(table.id) }
                        ]"
                    >
                        <div class="table-card__header">
                            <div>
                                <div class="table-card__title">
                                    {{ table.name }}
                                </div>
                                <div class="table-card__meta">
                                    <el-tooltip content="Sức chứa">
                                        <span class="meta-chip">
                                            <el-icon><UserFilled/></el-icon>
                                            {{ table.capacity }} người
                                        </span>
                                    </el-tooltip>
                                    <el-tooltip
                                        v-if="needsCleaning(table.id)"
                                        content="Đang chờ dọn dẹp"
                                    >
                                        <el-tag type="warning" size="small">Cần dọn</el-tag>
                                    </el-tooltip>
                                </div>
                            </div>

                            <div class="table-card__actions--top">
                                <el-tooltip :content="isPinned(table.id) ? 'Bỏ ghim bàn' : 'Ghim để ưu tiên'">
                                    <el-button
                                        link
                                        size="small"
                                        @click="togglePin(table.id)"
                                        :icon="isPinned(table.id) ? StarFilled : Star"
                                    />
                                </el-tooltip>
                                <el-tooltip :content="needsCleaning(table.id) ? 'Đã dọn xong' : 'Đánh dấu cần dọn'">
                                    <el-button
                                        link
                                        size="small"
                                        @click="toggleCleaning(table.id)"
                                        :icon="needsCleaning(table.id) ? BrushFilled : Brush"
                                    />
                                </el-tooltip>
                            </div>
                        </div>

                        <div class="table-card__status">
                            <span class="status-pill" :class="`status-pill--${table.status.toLowerCase()}`">
                                {{ statusMeta[table.status]?.label || table.status }}
                            </span>
                            <el-tag
                                v-if="statusMeta[table.status]?.note"
                                :type="statusMeta[table.status].tagType"
                                size="small"
                            >
                                {{ statusMeta[table.status].note }}
                            </el-tag>
                        </div>

                        <div class="table-card__body">
                            <div class="table-card__info">
                                <span class="info-title">Cập nhật trạng thái</span>
                                <el-select
                                    :model-value="table.status"
                                    size="small"
                                    class="status-select"
                                    @change="(newStatus) => handleStatusChange(table, newStatus)"
                                >
                                    <el-option
                                        v-for="option in statusOptions"
                                        :key="option.value"
                                        :label="option.label"
                                        :value="option.value"
                                    />
                                </el-select>
                            </div>
                            <div class="table-card__markers">
                                <el-tag v-if="isPinned(table.id)" type="success" effect="plain" size="small">
                                    Ưu tiên
                                </el-tag>
                                <el-tag
                                    v-else-if="table.status === 'EMPTY'"
                                    type="info"
                                    effect="plain"
                                    size="small"
                                >
                                    Sẵn sàng phục vụ
                                </el-tag>
                            </div>
                        </div>

                        <div class="table-card__footer">
                            <div class="footer-actions">
                                <el-button
                                    type="primary"
                                    plain
                                    size="small"
                                    @click="openEditModal(table)"
                                >
                                    Sửa thông tin
                                </el-button>
                                <el-popconfirm
                                    title="Bạn chắc chắn muốn xóa bàn này?"
                                    confirm-button-text="Đồng ý"
                                    cancel-button-text="Hủy"
                                    @confirm="handleDelete(table.id)"
                                >
                                    <template #reference>
                                        <el-button type="danger" plain size="small">Xóa</el-button>
                                    </template>
                                </el-popconfirm>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else key="list">
                <EasyDataTable
                    :headers="headers"
                    :items="displayTables"
                    :loading="loading"
                    table-class-name="data-table"
                    theme-color="#8B7355"
                    show-index
                >
                    <template #item-status="item">
                        <el-select :model-value="item.status"
                                   @change="(newStatus) => handleStatusChange(item, newStatus)"
                                   :class="getStatusClass(item.status)" placeholder="Cập nhật"
                                   size="small">
                            <el-option label="Trống" value="EMPTY"/>
                            <el-option label="Đang phục vụ" value="SERVING"/>
                            <el-option label="Đã đặt" value="RESERVED"/>
                        </el-select>
                    </template>

                    <template #item-actions="item">
                        <el-button type="primary" plain size="small" @click="openEditModal(item)">
                            Sửa
                        </el-button>
                        <el-popconfirm title="Bạn chắc chắn muốn xóa?" confirm-button-text="Đồng ý"
                                       cancel-button-text="Hủy" @confirm="handleDelete(item.id)">
                            <template #reference>
                                <el-button type="danger" plain size="small">Xóa</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </EasyDataTable>
            </div>
        </transition>

        <TableFormModal v-model:visible="modalVisible" :table="selectedTable" @success="handleModalSuccess"/>

    </div>
</template>

<script setup>
import {ref, onMounted, computed, watch} from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import {useToast} from 'vue-toastification'
import {
    Plus,
    Search,
    Grid,
    List,
    RefreshRight,
    UserFilled,
    Star,
    StarFilled,
    Brush,
    BrushFilled
} from '@element-plus/icons-vue'
import {getAllTables, deleteTable, updateTableStatus} from '@/api/tableService'
import TableFormModal from '@/components/TableFormModal.vue'

const toast = useToast()

const tables = ref([])
const loading = ref(true)

const modalVisible = ref(false)
const selectedTable = ref(null)

const searchQuery = ref('')
const filterStatus = ref(null)
const filterCapacity = ref(null)
const viewMode = ref(localStorage.getItem('tableManager:viewMode') || 'grid')
const pinnedTableIds = ref(JSON.parse(localStorage.getItem('tableManager:pinnedIds') || '[]'))
const cleaningTableIds = ref(JSON.parse(localStorage.getItem('tableManager:cleaningIds') || '[]'))

const headers = [
    {text: "ID", value: "id"},
    {text: "Tên Bàn", value: "name", sortable: true},
    {text: "Sức chứa", value: "capacity", sortable: true, width: 200},
    {text: "Trạng thái", value: "status", width: 300},
    {text: "Hành động", value: "actions", width: 200},
]

const statusOptions = [
    {label: 'Trống', value: 'EMPTY'},
    {label: 'Đang phục vụ', value: 'SERVING'},
    {label: 'Đã đặt', value: 'RESERVED'}
]

const quickStatusOptions = [
    {label: 'Tất cả', value: null},
    {label: 'Bàn trống', value: 'EMPTY'},
    {label: 'Đang phục vụ', value: 'SERVING'},
    {label: 'Đã đặt', value: 'RESERVED'}
]

const statusMeta = {
    EMPTY: {
        label: 'Bàn trống',
        tagType: 'success',
        note: 'Sẵn sàng phục vụ'
    },
    SERVING: {
        label: 'Đang phục vụ',
        tagType: 'warning',
        note: 'Đã có khách'
    },
    RESERVED: {
        label: 'Đã đặt',
        tagType: 'info',
        note: 'Giữ chỗ trước'
    }
}

const filteredTables = computed(() => {
    let result = tables.value

    // Filter by search
    if (searchQuery.value) {
        result = result.filter(t =>
            t.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    }

    // Filter by status
    if (filterStatus.value) {
        result = result.filter(t => t.status === filterStatus.value)
    }

    // Filter by capacity
    if (filterCapacity.value) {
        const [min, max] = filterCapacity.value.split('-').map(v => v === '+' ? 999 : parseInt(v))
        result = result.filter(t => {
            if (filterCapacity.value === '7+') {
                return t.capacity >= 7
            }
            return t.capacity >= min && t.capacity <= max
        })
    }

    return result
})

const statusSummary = computed(() => {
    const summary = {
        total: tables.value.length,
        EMPTY: 0,
        SERVING: 0,
        RESERVED: 0
    }
    tables.value.forEach((table) => {
        if (summary[table.status] !== undefined) {
            summary[table.status] += 1
        }
    })
    return summary
})

const displayTables = computed(() => {
    const pinnedSet = new Set(pinnedTableIds.value)
    const base = filteredTables.value.slice()
    base.sort((a, b) => {
        const aPinned = pinnedSet.has(a.id)
        const bPinned = pinnedSet.has(b.id)
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
        if (a.status !== b.status) {
            return a.status.localeCompare(b.status)
        }
        return a.name.localeCompare(b.name)
    })
    return base
})

const fetchTables = async () => {
    loading.value = true
    try {
        const response = await getAllTables()
        tables.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải danh sách bàn')
    } finally {
        loading.value = false
    }
}

const openCreateModal = () => {
    selectedTable.value = null
    modalVisible.value = true
}

const openEditModal = (table) => {
    selectedTable.value = {...table}
    modalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        // API backend sẽ kiểm tra nếu bàn có đơn hàng
        await deleteTable(id)
        toast.success('Xóa bàn thành công!')
        await fetchTables() // Tải lại dữ liệu
    } catch (error) {
        // Bắt lỗi 400 (IllegalArgumentException) từ backend
        const msg = error.response?.data?.message || 'Lỗi khi xóa bàn'
        if (msg.includes("associated orders")) {
            toast.error('Không thể xóa! Bàn đang có đơn hàng liên kết.')
        } else {
            toast.error(msg)
        }
    }
}

// Xử lý Cập nhật Trạng thái - Real-time update
const handleStatusChange = async (tableRow, newStatus) => {
    const oldStatus = tableRow.status

    try {
        // Optimistic update - Cập nhật UI ngay lập tức
        const tableIndex = tables.value.findIndex(t => t.id === tableRow.id)
        if (tableIndex !== -1) {
            tables.value[tableIndex].status = newStatus
        }

        // Call API
        await updateTableStatus(tableRow.id, newStatus)

        // Show success message
        const statusText = {
            'EMPTY': 'Trống',
            'SERVING': 'Đang phục vụ',
            'RESERVED': 'Đã đặt'
        }
        toast.success(`Cập nhật bàn '${tableRow.name}' thành ${statusText[newStatus]}`)
    } catch (error) {
        // Rollback on error
        const tableIndex = tables.value.findIndex(t => t.id === tableRow.id)
        if (tableIndex !== -1) {
            tables.value[tableIndex].status = oldStatus
        }

        const msg = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái'
        toast.error(msg)
    }
}

// (MỚI) Lấy class màu cho Select (giả lập Tag)
const getStatusClass = (status) => {
    if (status === 'EMPTY') return 'status-select status-empty'
    if (status === 'SERVING') return 'status-select status-serving'
    if (status === 'RESERVED') return 'status-select status-reserved'
    return 'status-select'
}

const isPinned = (id) => pinnedTableIds.value.includes(id)

const togglePin = (id) => {
    if (isPinned(id)) {
        pinnedTableIds.value = pinnedTableIds.value.filter((tableId) => tableId !== id)
    } else {
        pinnedTableIds.value = [...pinnedTableIds.value, id]
    }
}

const needsCleaning = (id) => cleaningTableIds.value.includes(id)

const toggleCleaning = (id) => {
    if (needsCleaning(id)) {
        cleaningTableIds.value = cleaningTableIds.value.filter((tableId) => tableId !== id)
    } else {
        cleaningTableIds.value = [...cleaningTableIds.value, id]
    }
}

const handleQuickStatus = (value) => {
    filterStatus.value = filterStatus.value === value ? null : value
}

// Khi modal (thêm/sửa) thành công
const handleModalSuccess = () => {
    fetchTables() // Tải lại bảng
}

watch(pinnedTableIds, (value) => {
    localStorage.setItem('tableManager:pinnedIds', JSON.stringify(value))
}, {deep: true})

watch(cleaningTableIds, (value) => {
    localStorage.setItem('tableManager:cleaningIds', JSON.stringify(value))
}, {deep: true})

watch(viewMode, (value) => {
    localStorage.setItem('tableManager:viewMode', value)
})

onMounted(() => {
    fetchTables()
})
</script>

<style>

.custom-height {
    min-height: 105vh;
}

.table-dashboard {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
}

.table-dashboard__summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
}

.summary-card {
    position: relative;
    padding: 18px;
    border-radius: 16px;
    color: #2c2c2c;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.summary-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%);
}

.summary-card.total {
    background: linear-gradient(135deg, #e0e6f6 0%, #cdd6f5 100%);
}

.summary-card.empty {
    background: linear-gradient(135deg, #e5f8f0 0%, #c5f1dd 100%);
}

.summary-card.serving {
    background: linear-gradient(135deg, #fff1dd 0%, #ffe0b2 100%);
}

.summary-card.reserved {
    background: linear-gradient(135deg, #f6e2ff 0%, #e4c8ff 100%);
}

.summary-card__label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    opacity: 0.8;
}

.summary-card__value {
    font-size: 1.8rem;
    font-weight: 700;
    margin-top: 8px;
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
}

.table-dashboard__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
}

.quick-tags {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.quick-tags__label {
    font-weight: 600;
    color: #4f4f4f;
}

.view-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.refresh-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.table-grid-wrapper {
    position: relative;
}

.table-grid {
    display: grid;
    grid-template-columns: repeat(4,  1fr);
    gap: 18px;
}

.table-grid--loading {
    opacity: 0.6;
    pointer-events: none;
}

.table-card {
    position: relative;
    padding: 18px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.table-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
    border-color: transparent;
}

.table-card--empty {
    box-shadow: 0 18px 40px rgba(34, 197, 94, 0.12);
}

.table-card--serving {
    box-shadow: 0 18px 40px rgba(244, 114, 182, 0.18);
}

.table-card--reserved {
    box-shadow: 0 18px 40px rgba(96, 165, 250, 0.2);
}

.table-card--pinned::before {
    content: '★';
    position: absolute;
    top: 12px;
    right: 12px;
    color: #f59e0b;
    font-size: 1.2rem;
}

.table-card--cleaning {
    border: 1px dashed #f59e0b;
}

.table-card__header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
}

.table-card__title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #111827;
}

.table-card__meta {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
    font-weight: 600;
    font-size: 0.85rem;
}

.table-card__actions--top {
    display: flex;
    gap: 4px;
}

.table-card__status {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.75rem;
}

.status-pill--empty {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
}

.status-pill--serving {
    background: rgba(249, 115, 22, 0.15);
    color: #d97706;
}

.status-pill--reserved {
    background: rgba(59, 130, 246, 0.15);
    color: #1d4ed8;
}

.table-card__body {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.table-card__info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.info-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: #4b5563;
}

.table-card__markers {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.table-card__footer {
    display: flex;
    justify-content: flex-end;
}

.footer-actions {
    display: flex;
    gap: 8px;
}

.status-select {
    min-width: 160px;
}

.status-select.status-empty :deep(.el-input__wrapper) {
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.35);
}

.status-select.status-serving :deep(.el-input__wrapper) {
    box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.35);
}

.status-select.status-reserved :deep(.el-input__wrapper) {
    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
}

:deep(.el-check-tag.is-checked) {
    background-color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: #fff;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 768px) {
    .table-card {
        padding: 16px;
    }

    .table-card__body {
        flex-direction: column;
        align-items: stretch;
    }

    .table-dashboard__controls {
        flex-direction: column;
        align-items: flex-start;
    }

    .view-controls {
        width: 100%;
        justify-content: space-between;
    }

    .table-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}

</style>
