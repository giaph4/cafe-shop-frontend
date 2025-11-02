<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Tồn kho</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Thêm Nguyên vật liệu
            </el-button>
        </div>

        <el-card class="box-card filter-card mb-3">
            <el-row>
                <el-col :span="12">
                    <el-input v-model="searchQuery" placeholder="Tìm theo Tên nguyên vật liệu..."
                        @input="debouncedSearch" clearable />
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
            :headers="headers" :items="items" :loading="loading" table-class-name="data-table" theme-color="#409EFF"
            buttons-pagination show-index>
            <template #item-quantityOnHand="{ quantityOnHand, unit, reorderLevel }">
                <el-tag :type="quantityOnHand <= reorderLevel ? 'danger' : 'primary'" effect="light">
                    {{ quantityOnHand }} {{ unit }}
                </el-tag>
            </template>

            <template #item-actions="item">
                <el-button type="success" plain size="small" @click="openAdjustModal(item)">
                    Kiểm kho
                </el-button>
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

        <IngredientFormModal v-model:visible="formModalVisible" :ingredient="selectedIngredient"
            @success="handleModalSuccess" />

        <InventoryAdjustModal v-model:visible="adjustModalVisible" :ingredient="selectedIngredient"
            @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus } from '@element-plus/icons-vue'
import { getIngredients, deleteIngredient } from '@/api/ingredientService'
import IngredientFormModal from '@/components/IngredientFormModal.vue'
import InventoryAdjustModal from '@/components/InventoryAdjustModal.vue'

const toast = useToast()

// --- State cho Bảng ---
const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'name', // Sắp xếp mặc định
    sortType: 'asc',
})

// --- State cho Modals ---
const formModalVisible = ref(false)
const adjustModalVisible = ref(false)
const selectedIngredient = ref(null)

// --- State cho Bộ lọc ---
const searchQuery = ref('')
let searchTimer = null

// --- Định nghĩa Cột cho Bảng ---
const headers = [
    { text: "Tên Nguyên vật liệu", value: "name", sortable: true },
    { text: "Tồn kho", value: "quantityOnHand", sortable: true, width: 150 },
    { text: "Đơn vị", value: "unit", width: 100 },
    { text: "Ngưỡng cảnh báo", value: "reorderLevel", width: 180 },
    { text: "Hành động", value: "actions", width: 280 },
]

// --- Hàm Tải Dữ liệu Chính ---
const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            sort: `${serverOptions.value.sortBy},${serverOptions.value.sortType}`,
            name: searchQuery.value || null, // API backend dùng `name`
        }

        const response = await getIngredients(params)

        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách tồn kho')
    } finally {
        loading.value = false
    }
}

// --- Xử lý Tìm kiếm (Debounce) ---
const debouncedSearch = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        serverOptions.value.page = 1
        fetchData()
    }, 500)
}

// --- Xử lý CRUD ---
const openCreateModal = () => {
    selectedIngredient.value = null
    formModalVisible.value = true
}

const openEditModal = (ingredient) => {
    selectedIngredient.value = { ...ingredient }
    formModalVisible.value = true
}

// (MỚI) Mở modal kiểm kho
const openAdjustModal = (ingredient) => {
    selectedIngredient.value = { ...ingredient }
    adjustModalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        // API backend sẽ kiểm tra (nếu có)
        await deleteIngredient(id)
        toast.success('Xóa nguyên vật liệu thành công!')
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xóa'
        // (Backend chưa có check ràng buộc, nếu có thì thêm ở đây)
        toast.error(msg)
    }
}

// Khi modal (thêm/sửa/kiểm kho) thành công
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