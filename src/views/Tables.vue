<template>
    <div class="app-page-container fade-in-up">
        <div class="page-header">
            <h1 class="page-title">Quản lý Bàn</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
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
                            <el-icon><Search /></el-icon>
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
                        <el-option label="Tất cả trạng thái" :value="null" />
                        <el-option label="Trống (EMPTY)" value="EMPTY" />
                        <el-option label="Đang phục vụ (SERVING)" value="SERVING" />
                        <el-option label="Đã đặt (RESERVED)" value="RESERVED" />
                    </el-select>
                </el-col>
                <el-col :span="8">
                    <el-select
                        v-model="filterCapacity"
                        placeholder="Lọc theo sức chứa"
                        clearable
                        class="w-100"
                    >
                        <el-option label="Tất cả sức chứa" :value="null" />
                        <el-option label="1-2 người" value="1-2" />
                        <el-option label="3-4 người" value="3-4" />
                        <el-option label="5-6 người" value="5-6" />
                        <el-option label="7+ người" value="7+" />
                    </el-select>
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable
            :headers="headers"
            :items="filteredTables"
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
                    <el-option label="Trống" value="EMPTY" />
                    <el-option label="Đang phục vụ" value="SERVING" />
                    <el-option label="Đã đặt" value="RESERVED" />
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

        <TableFormModal v-model:visible="modalVisible" :table="selectedTable" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus, Search } from '@element-plus/icons-vue'
import { getAllTables, deleteTable, updateTableStatus } from '@/api/tableService'
import TableFormModal from '@/components/TableFormModal.vue'

const toast = useToast()

const tables = ref([])
const loading = ref(true)

const modalVisible = ref(false)
const selectedTable = ref(null)

const searchQuery = ref('')
const filterStatus = ref(null)
const filterCapacity = ref(null)

const headers = [
    { text: "ID", value: "id"},
    { text: "Tên Bàn", value: "name", sortable: true },
    { text: "Sức chứa", value: "capacity", sortable: true, width: 200 },
    { text: "Trạng thái", value: "status", width: 300 },
    { text: "Hành động", value: "actions", width: 300 },
]

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
    selectedTable.value = { ...table }
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

// Khi modal (thêm/sửa) thành công
const handleModalSuccess = () => {
    fetchTables() // Tải lại bảng
}

onMounted(() => {
    fetchTables()
})
</script>

<style>
.status-select .el-input__wrapper {
    background-color: var(--el-color-info-light-9) !important;
    border: 1px solid var(--el-color-info-light-7) !important;
    color: var(--el-color-info) !important;
    box-shadow: none !important;
    font-weight: 600;
    border-radius: 8px;
}

.status-select.status-empty .el-input__wrapper {
    background-color: var(--el-color-success-light-9) !important;
    border-color: var(--el-color-success) !important;
    color: var(--el-color-success) !important;
}

.status-select.status-serving .el-input__wrapper {
    background-color: var(--el-color-danger-light-9) !important;
    border-color: var(--el-color-danger) !important;
    color: var(--el-color-danger) !important;
}

.status-select.status-reserved .el-input__wrapper {
    background-color: var(--el-color-warning-light-9) !important;
    border-color: var(--el-color-warning) !important;
    color: var(--el-color-warning) !important;
}

.app-page-container {
    padding: 20px;
}

.filter-card {
    margin-bottom: 20px;
}

.w-100 {
    width: 100%;
}
</style>
