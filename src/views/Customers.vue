<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Khách hàng</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Thêm Khách hàng
            </el-button>
        </div>

        <el-card class="box-card filter-card mb-3">
            <el-row>
                <el-col :span="12">
                    <el-input v-model="searchQuery" placeholder="Tìm theo Tên hoặc SĐT..." @input="debouncedSearch"
                        clearable />
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
            :headers="headers" :items="items" :loading="loading" table-class-name="data-table" theme-color="#409EFF"
            buttons-pagination show-index>
            <template #item-loyaltyPoints="{ loyaltyPoints }">
                <el-tag effect="light">{{ loyaltyPoints }} điểm</el-tag>
            </template>

            <template #item-createdAt="{ createdAt }">
                {{ createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : 'N/A' }}
            </template>

            <template #item-actions="item">
                <el-button type="primary" plain size="small" @click="openEditModal(item)">
                    Sửa
                </el-button>
                <el-popconfirm title="Bạn chắc chắn muốn xóa?" confirm-button-text="Đồng ý" cancel-button-text="Hủy"
                    @confirm="handleDelete(item.id)">
                    <template #reference>
                        <el-button type="danger" plain size="small">Xóa</el-button>
                    </template>
                </el-popconfirm>
            </template>
        </EasyDataTable>

        <CustomerFormModal v-model:visible="modalVisible" :customer="selectedCustomer" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus } from '@element-plus/icons-vue'
import { searchCustomers, deleteCustomer } from '@/api/customerService'
import CustomerFormModal from '@/components/CustomerFormModal.vue'

const toast = useToast()

// --- State cho Bảng ---
const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'fullName', // Sắp xếp mặc định
    sortType: 'asc',
})

// --- State cho Modal ---
const modalVisible = ref(false)
const selectedCustomer = ref(null)

// --- State cho Bộ lọc ---
const searchQuery = ref('')
let searchTimer = null

// --- Định nghĩa Cột cho Bảng ---
const headers = [
    { text: "Tên Khách hàng", value: "fullName", sortable: true },
    { text: "Số điện thoại", value: "phone" },
    { text: "Email", value: "email", sortable: true },
    { text: "Điểm tích lũy", value: "loyaltyPoints", sortable: true, width: 150 },
    { text: "Ngày tham gia", value: "createdAt", sortable: true, width: 150 },
    { text: "Hành động", value: "actions", width: 180 },
]

// --- Hàm Tải Dữ liệu Chính ---
const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1, // API Spring Boot bắt đầu từ 0
            size: serverOptions.value.rowsPerPage,
            sort: `${serverOptions.value.sortBy},${serverOptions.value.sortType}`,
            keyword: searchQuery.value || "", // API backend dùng `keyword`
        }

        const response = await searchCustomers(params)

        // Dữ liệu Page<> của Spring Boot
        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách khách hàng')
    } finally {
        loading.value = false
    }
}

// --- Xử lý Tìm kiếm (Debounce) ---
const debouncedSearch = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        serverOptions.value.page = 1 // Reset về trang 1 khi tìm kiếm
        fetchData()
    }, 500)
}

// --- Xử lý CRUD ---
const openCreateModal = () => {
    selectedCustomer.value = null
    modalVisible.value = true
}

const openEditModal = (customer) => {
    selectedCustomer.value = { ...customer }
    modalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        // API backend sẽ kiểm tra (nếu có)
        await deleteCustomer(id)
        toast.success('Xóa khách hàng thành công!')
        await fetchData() // Tải lại dữ liệu
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xóa khách hàng'
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

.data-table {
    --easy-table-header-font-size: 14px;
    --easy-table-header-font-weight: 600;
    --easy-table-body-row-font-size: 14px;
}
</style>