<template>
    <div class="app-page-container animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <h1 class="page-title">Quản lý Danh mục</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Thêm Danh mục
            </el-button>
        </div>

        <el-card class="box-card filter-card">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-input
                        v-model="searchQuery"
                        placeholder="Tìm theo tên danh mục..."
                        clearable
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable
            :headers="headers"
            :items="filteredCategories"
            :loading="loading"
            table-class-name="data-table"
            theme-color="#8B7355"
            show-index
        >
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

        <CategoryModal v-model:visible="modalVisible" :category="selectedCategory" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus, Search } from '@element-plus/icons-vue'
import { getAllCategories, deleteCategory } from '@/api/categoryService'
import CategoryModal from '@/components/CategoryModal.vue'

const toast = useToast()

const categories = ref([])
const loading = ref(true)
const searchQuery = ref('')

const headers = [
    { text: "ID", value: "id", width: 80 },
    { text: "Tên Danh mục", value: "name", sortable: true },
    { text: "Mô tả", value: "description", sortable: true },
    { text: "Hành động", value: "actions", width: 180 },
]

const filteredCategories = computed(() => {
    if (!searchQuery.value) return categories.value
    
    return categories.value.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
})

const modalVisible = ref(false)
const selectedCategory = ref(null)

const fetchCategories = async () => {
    loading.value = true
    try {
        const response = await getAllCategories()
        categories.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải danh sách danh mục')
    } finally {
        loading.value = false
    }
}

const openCreateModal = () => {
    selectedCategory.value = null
    modalVisible.value = true
}

const openEditModal = (category) => {
    selectedCategory.value = { ...category } // Copy object để tránhSửa trực tiếp
    modalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        await deleteCategory(id)
        toast.success('Xóa danh mục thành công!')
        await fetchCategories() // Tải lại dữ liệu
    } catch (error) {
        // Bắt lỗi từ GlobalExceptionHandler (DataIntegrityViolationException)
        const msg = error.response?.data?.message || 'Lỗi khi xóa danh mục'
        if (msg.includes("foreign key constraint")) {
            toast.error('Không thể xóa! Danh mục đang được sản phẩm sử dụng.')
        } else {
            toast.error(msg)
        }
    }
}

// Khi modal (thêm/sửa) thành công
const handleModalSuccess = () => {
    fetchCategories() // Tải lại bảng
}

onMounted(() => {
    fetchCategories()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}
</style>
