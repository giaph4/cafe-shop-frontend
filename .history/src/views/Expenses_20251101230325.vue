<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Chi phí</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Ghi nhận Chi phí
            </el-button>
        </div>

        <el-card class="box-card filter-card mb-3">
            <el-row>
                <el-col :span="12">
                    <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="Đến"
                        start-placeholder="Từ ngày" end-placeholder="Đến ngày" @change="fetchData" :clearable="true"
                        class="w-100" />
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
            :headers="headers" :items="items" :loading="loading" table-class-name="data-table" theme-color="#409EFF"
            buttons-pagination>
            <template #item-expenseDate="{ expenseDate }">
                {{ new Date(expenseDate).toLocaleDateString('vi-VN') }}
            </template>

            <template #item-amount="{ amount }">
                {{ formatCurrency(amount) }}
            </template>

            <template #item-category="{ category }">
                <el-tag effect="light">{{ category }}</el-tag>
            </template>

            <template #item-actions="item">
                <el-button type="primary" plain size="small" @click="openEditModal(item)">
                    Sửa
                </el-button>
                <el-popconfirm v-if="authStore.isAdmin" title="Bạn chắc chắn muốn xóa chi phí này?"
                    confirm-button-text="Đồng ý" cancel-button-text="Hủy" @confirm="handleDelete(item.id)">
                    <template #reference>
                        <el-button type="danger" plain size="small">Xóa</el-button>
                    </template>
                </el-popconfirm>
            </template>
        </EasyDataTable>

        <ExpenseFormModal v-model:visible="modalVisible" :expense="selectedExpense" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth' // Import auth store
import { formatCurrency, formatDateISO } from '@/utils/formatters'
import { getExpenses, deleteExpense } from '@/api/expenseService'
import ExpenseFormModal from '@/components/ExpenseFormModal.vue'

const toast = useToast()
const authStore = useAuthStore() // Khởi tạo auth store

// --- State cho Bảng ---
const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'expenseDate', // Sắp xếp mặc định
    sortType: 'desc',
})

// --- State cho Modal ---
const modalVisible = ref(false)
const selectedExpense = ref(null)

// --- State cho Bộ lọc ---
const filters = ref({
    dateRange: null,
})

// --- Định nghĩa Cột cho Bảng ---
const headers = [
    { text: "Ngày chi", value: "expenseDate", sortable: true, width: 120 },
    { text: "Loại chi phí", value: "category", sortable: true, width: 180 },
    { text: "Số tiền", value: "amount", sortable: true, align: 'right' },
    { text: "Mô tả", value: "description", sortable: false },
    { text: "Người ghi nhận", value: "username", sortable: true, width: 150 },
    { text: "Hành động", value: "actions", width: 180 },
]

// --- Hàm Tải Dữ liệu Chính ---
const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            sort: `${serverOptions.value.sortBy},${serverOptions.value.sortType}`,
            // Lọc
            startDate: filters.value.dateRange ? formatDateISO(filters.value.dateRange[0]) : null,
            endDate: filters.value.dateRange ? formatDateISO(filters.value.dateRange[1]) : null,
        }

        // API GET /api/v1/expenses
        const response = await getExpenses(params)

        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách chi phí')
    } finally {
        loading.value = false
    }
}

// --- Xử lý CRUD ---
const openCreateModal = () => {
    selectedExpense.value = null
    modalVisible.value = true
}

const openEditModal = (expense) => {
    selectedExpense.value = { ...expense }
    modalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        await deleteExpense(id)
        toast.success('Xóa chi phí thành công!')
        await fetchData() // Tải lại dữ liệu
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xóa chi phí'
        toast.error(msg)
    }
}

// Khi modal (thêm/sửa) thành công
const handleModalSuccess = () => {
    fetchData() // Tải lại bảng
}

// --- Theo dõi khi serverOptions thay đổi (click phân trang / sort) ---
watch(serverOptions, (newValue, oldValue) => {
    fetchData()
}, { deep: true })

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.filter-card {
    margin-bottom: 20px;
}

.w-100 {
    width: 100%;
}

.data-table {
    --easy-table-header-font-size: 14px;
    --easy-table-header-font-weight: 600;
    --easy-table-body-row-font-size: 14px;
}
</style>