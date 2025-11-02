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
                <el-image :src="imageUrl" fit="cover" class="product-table-image" preview-teleported
                    :preview-src-list="[imageUrl]" lazy>
                    <template #error>
                        <div class="image-slot">
                            <el-icon>
                                <Picture />
                            </el-icon>
                        </div>
                    </template>
                </el-image>
            </template>

            <template #item-price="{ price }">
                {{ formatCurrency(price) }}
            </template>

            <template #item-available="{ available, id }">
                <el-switch :model-value="available" @change="() => handleToggleAvailability(id, available)" />
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

        <ProductModal v-model:visible="modalVisible" :product="selectedProduct" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus, Picture } from '@element-plus/icons-vue' // Import icons
import { formatCurrency } from '@/utils/formatters'
import { getProducts, deleteProduct, toggleProductAvailability } from '@/api/productService'
import { getAllCategories } from '@/api/categoryService'
import ProductModal from '@/components/ProductModal.vue'

const toast = useToast()

// --- State cho Bảng ---
const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    // sortBy: 'name', (Backend của bạn có hỗ trợ sort không? Tạm thời bỏ qua)
    // sortType: 'asc',
})

// --- State cho Modal ---
const modalVisible = ref(false)
const selectedProduct = ref(null)

// --- State cho Bộ lọc ---
const searchQuery = ref('')
const selectedCategory = ref(null)
const categories = ref([])
let searchTimer = null

// --- Định nghĩa Cột cho Bảng ---
const headers = [
    { text: "Ảnh", value: "imageUrl", width: 80 },
    { text: "Tên Sản phẩm", value: "name", sortable: true },
    { text: "Mã SP", value: "code" },
    { text: "Danh mục", value: "categoryName" },
    { text: "Giá bán", value: "price", sortable: true },
    { text: "Trạng thái", value: "available", width: 100 },
    { text: "Hành động", value: "actions", width: 180 },
]

// --- Hàm Tải Dữ liệu Chính ---
const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1, // API Spring Boot bắt đầu từ 0
            size: serverOptions.value.rowsPerPage,
            name: searchQuery.value,
            categoryId: selectedCategory.value,
        }

        // API GET /api/v1/products của bạn trả về Page<>
        const response = await getProducts(params)

        // Dữ liệu Page<> của Spring Boot
        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách sản phẩm')
    } finally {
        loading.value = false
    }
}

// --- Tải Danh mục cho Bộ lọc ---
const fetchCategories = async () => {
    try {
        const response = await getAllCategories()
        categories.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải danh mục')
    }
}

// --- Xử lý Tìm kiếm (Debounce) ---
// Chờ 500ms sau khi gõ xong mới gọi API
const debouncedSearch = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        fetchData()
    }, 500)
}

// --- Xử lý CRUD ---
const openCreateModal = () => {
    selectedProduct.value = null // Đảm bảo đang ở chế độ tạo mới
    modalVisible.value = true
}

const openEditModal = (product) => {
    // Backend API GET /api/v1/products/{id} trả về ProductResponse
    // ProductResponse không có categoryId, nó chỉ có categoryName
    // Backend API PUT /api/v1/products/{id} lại yêu cầu categoryId

    // -> Đây là một điểm không đồng bộ trong API của bạn.
    // Tạm thời, chúng ta cần tìm categoryId từ categoryName (hoặc backend phải trả về categoryId)

    // Giải pháp Tạm thời: Gán categoryId dựa trên categoryName
    const matchingCategory = categories.value.find(c => c.name === product.categoryName)

    // Tạo object product đầy đủ cho modal
    const fullProductData = {
        ...product,
        categoryId: matchingCategory ? matchingCategory.id : null
    }

    selectedProduct.value = fullProductData
    modalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        await deleteProduct(id)
        toast.success('Xóa sản phẩm thành công!')
        await fetchData() // Tải lại dữ liệu
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xóa sản phẩm'
        toast.error(msg)
    }
}

const handleToggleAvailability = async (id, currentStatus) => {
    try {
        await toggleProductAvailability(id)
        toast.success(currentStatus ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm')
        await fetchData() // Tải lại dữ liệu
    } catch (error) {
        toast.error('Lỗi khi cập nhật trạng thái')
    }
}

// Khi modal (thêm/sửa) thành công
const handleModalSuccess = () => {
    fetchData() // Tải lại bảng
}

// --- Theo dõi khi serverOptions thay đổi (click phân trang) ---
watch(serverOptions, (newValue, oldValue) => {
    if (newValue.page !== oldValue.page || newValue.rowsPerPage !== oldValue.rowsPerPage) {
        fetchData()
    }
}, { deep: true })

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchCategories()
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

.product-table-image {
    width: 50px;
    height: 50px;
    border-radius: 4px;
    object-fit: cover;
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 24px;
}
</style>