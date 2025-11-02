<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Bàn</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Thêm Bàn
            </el-button>
        </div>

        <el-card class="box-card">
            <el-table :data="tables" v-loading="loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="Tên Bàn" sortable />
                <el-table-column prop="capacity" label="Sức chứa" width="120" align="center" />

                <el-table-column label="Trạng thái" width="180">
                    <template #default="scope">
                        <el-select :model-value="scope.row.status"
                            @change="(newStatus) => handleStatusChange(scope.row, newStatus)"
                            :class="getStatusClass(scope.row.status)" placeholder="Cập nhật">
                            <el-option label="Trống (EMPTY)" value="EMPTY" />
                            <el-option label="Đang phục vụ (SERVING)" value="SERVING" />
                            <el-option label="Đã đặt (RESERVED)" value="RESERVED" />
                        </el-select>
                    </template>
                </el-table-column>

                <el-table-column label="Hành động" width="180" align="right">
                    <template #default="scope">
                        <el-button type="primary" plain size="small" @click="openEditModal(scope.row)">
                            Sửa
                        </el-button>
                        <el-popconfirm title="Bạn chắc chắn muốn xóa?" confirm-button-text="Đồng ý"
                            cancel-button-text="Hủy" @confirm="handleDelete(scope.row.id)">
                            <template #reference>
                                <el-button type="danger" plain size="small">Xóa</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <TableFormModal v-model:visible="modalVisible" :table="selectedTable" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@element-plus/icons-vue'
import { getAllTables, deleteTable, updateTableStatus } from '@/api/tableService'
import TableFormModal from '@/components/TableFormModal.vue'

const toast = useToast()

// --- State cho Bảng ---
const tables = ref([])
const loading = ref(true)

// --- State cho Modal ---
const modalVisible = ref(false)
const selectedTable = ref(null)

// --- Hàm Tải Dữ liệu ---
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

// --- Xử lý CRUD ---
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

// (MỚI) Xử lý Cập nhật Trạng thái
const handleStatusChange = async (tableRow, newStatus) => {
    try {
        await updateTableStatus(tableRow.id, newStatus)
        // Cập nhật UI ngay lập tức để mượt mà
        tableRow.status = newStatus
        toast.success(`Cập nhật bàn '${tableRow.name}' thành ${newStatus}`)
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái'
        toast.error(msg)
        // (Không cần fetchTables() vì nếu lỗi thì trạng thái sẽ tự reset về giá trị cũ)
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

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchTables()
})
</script>

<style>
/* Style này KHÔNG 'scoped' để tùy chỉnh giao diện của el-select 
    cho cột trạng thái
  */
.status-select .el-input__wrapper {
    background-color: var(--el-color-info-light-9) !important;
    border: 1px solid var(--el-color-info-light-7) !important;
    color: var(--el-color-info) !important;
    box-shadow: none !important;
    font-weight: 500;
    border-radius: 4px;
}

.status-select.status-empty .el-input__wrapper {
    background-color: var(--el-color-success-light-9) !important;
    border-color: var(--el-color-success-light-7) !important;
    color: var(--el-color-success) !important;
}

.status-select.status-serving .el-input__wrapper {
    background-color: var(--el-color-danger-light-9) !important;
    border-color: var(--el-color-danger-light-7) !important;
    color: var(--el-color-danger) !important;
}

.status-select.status-reserved .el-input__wrapper {
    background-color: var(--el-color-warning-light-9) !important;
    border-color: var(--el-color-warning-light-7) !important;
    color: var(--el-color-warning) !important;
}

.app-page-container {
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
</style>