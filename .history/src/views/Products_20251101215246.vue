<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Sản phẩm</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Thêm Sản phẩm
            </el-button>
        </div>

        <el-card class="box-card filter-card mb-3">
            <el-row :gutter="20">
                <el-col :span="10">
                    <el-input v-model="searchQuery" placeholder="Tìm theo tên sản phẩm..." @input="debouncedSearch"
                        clearable />
                </el-col>
                <el-col :span="8">
                    <el-select v-model="selectedCategory" placeholder="Lọc theo danh mục" @change="fetchData" clearable
                        class="w-100">
                        <el-option v-for="category in categories" :key="category.id" :label="category.name"
                            :value="category.id" />
                    </el-select>
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
            :headers="headers" :items="items" :loading="loading" table-class-name="data-table" theme-color="#409EFF"
            buttons-pagination show-index>
            <template #item-imageUrl="{ imageUrl }">
                <el-image v-if="imageUrl" :src="imageUrl" fit="cover" class="product-table-image" preview-teleported
                    :preview-src-list="[imageUrl]" lazy>
                    <template #error>
                        <div class="image-slot">
                            <el-icon>
                                <Picture />
                            </el-icon>
                        </div>
                    </template>
                </el-image>
                <div v-else class="image-slot">
                    <el-icon>
                        <Picture />
                    </el-icon>
                </div>
            </template>

            <template #item-price="{ price }">
                {{ formatCurrency(price) }}
            </template>

            <template #item-available="{ available, id }">
                <el-switch :model-value="available" @change="() => handleToggleAvailability(id, available)" />
            </template>

            <template #item-actions="item">
                <el-button type="info" plain size="small" @click="openDetailModal(item.id)">
                    Xem
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

        <ProductFormModal v-model:visible="formModalVisible" :product="selectedProduct" :categories="categories"
            @success="handleModalSuccess" />

        <ProductDetailModal v-model:visible="detailModalVisible" :product-id="selectedProductId" />

    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus, Picture } from '@element-plus/icons-vue'
import { formatCurrency } from '@/utils/formatters'
import { getProducts, deleteProduct, toggleProductAvailability } from '@/api/productService'
import { getAllCategories } from '@/api/categoryService'

// Import 2 modal
import ProductFormModal from '@/components/ProductFormModal.vue'
import ProductDetailModal from '@/components/ProductDetailModal.vue'

const toast = useToast()

// --- State cho Bảng ---
const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
})

// --- State cho Modal ---
const formModalVisible = ref(false)
const detailModalVisible = ref(false)
const selectedProduct = ref(null) // Dùng cho Form Modal
const selectedProductId = ref(null) // Dùng cho Detail Modal

// --- State cho Bộ lọc ---
const searchQuery = ref('')
const selectedCategory = ref(null)
const categories = ref([]) // Cần cho cả filter và form modal
let searchTimer = null

// --- Định nghĩa Cột cho Bảng ---
const headers = [
    { text: "Ảnh", value: "imageUrl", width: 80 },
    { text: "Tên Sản phẩm", value: "name", sortable: true },
    { text: "Mã SP", value: "code" },
    { text: "Danh mục", value: "categoryName" },
    { text: "Giá bán", value: "price", sortable: true },
    { text: "Trạng thái", value: "available", width: 100 },
    { text: "Hành động", value: "actions", width: 220 }, // Tăng chiều rộng
]

// --- Hàm Tải Dữ liệu Chính ---
const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            name: searchQuery.value || null, // Gửi null nếu rỗng
            categoryId: selectedCategory.value || null,
        }

        const response = await getProducts(params)
        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách sản phẩm')
    } finally {
        loading.value = false
    }
}

// --- Tải Danh mục ---
const fetchCategories = async () => {
    try {
        const response = await getAllCategories()
        categories.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải danh mục')
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
    selectedProduct.value = null
    formModalVisible.value = true
}

const openEditModal = (product) => {
    selectedProduct.value = product // Pass toàn bộ item, modal sẽ tự xử lý
    formModalVisible.value = true
}

// (MỚI) Mở modal xem chi tiết
const openDetailModal = (id) => {
    selectedProductId.value = id
    detailModalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        await deleteProduct(id)
        toast.success('Xóa sản phẩm thành công!')
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xóa sản phẩm'
        toast.error(msg)
    }
}

const handleToggleAvailability = async (id, currentStatus) => {
    try {
        await toggleProductAvailability(id)
        toast.success(currentStatus ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm')
        await fetchData()
    } catch (error) {
        toast.error('Lỗi khi cập nhật trạng thái')
    }
}

// Khi modal (thêm/sửa) thành công
const handleModalSuccess = () => {
    fetchData() // Tải lại bảng
}

// --- Theo dõi khi phân trang thay đổi ---
watch(serverOptions, (newValue, oldValue) => {
    if (newValue.page !== oldValue.page || newValue.rowsPerPage !== oldValue.rowsPerPage) {
        fetchData()
    }
}, { deep: true })

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchCategories() // Tải danh mục trước
    fetchData() // Sau đó tải sản phẩm
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

.product-table-image {
    width: 50px;
    height: 50px;
    border-radius: 4px;
    object-fit: cover;
    cursor: pointer;
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 24px;
}
</style>