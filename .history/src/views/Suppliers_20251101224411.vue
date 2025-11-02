<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Nhà cung cấp</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Thêm Nhà cung cấp
            </el-button>
        </div>

        <el-card class="box-card filter-card mb-3">
            <el-row>
                <el-col :span="12">
                    <el-input v-model="searchQuery" placeholder="Tìm theo Tên, SĐT, Email,..." clearable />
                </el-col>
            </el-row>
        </el-card>

        <el-card class="box-card">
            <el-table :data="filteredSuppliers" v-loading="loading" style="width: 100%">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column prop="name" label="Tên Nhà cung cấp" sortable />
                <el-table-column prop="contactPerson" label="Người liên hệ" width="180" />
                <el-table-column prop="phone" label="Số điện thoại" width="150" />
                <el-table-column prop="email" label="Email" width="200" />
                <el-table-column prop="address" label="Địa chỉ" show-overflow-tooltip />

                <el-table-column label="Hành động" width="180" align="right">
                    <template #default="scope">
                        <el-button type="primary" plain size="small" @click="openEditModal(scope.row)">
                            Sửa
                        </el-button>
                        <el-popconfirm v-if="authStore.isAdmin" title="Bạn chắc chắn muốn xóa?"
                            confirm-button-text="Đồng ý" cancel-button-text="Hủy" @confirm="handleDelete(scope.row.id)">
                            <template #reference>
                                <el-button type="danger" plain size="small">Xóa</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <SupplierFormModal v-model:visible="modalVisible" :supplier="selectedSupplier" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth' // Import auth store để check quyền Admin
import { getAllSuppliers, deleteSupplier } from '@/api/supplierService'
import SupplierFormModal from '@/components/SupplierFormModal.vue'

const toast = useToast()
const authStore = useAuthStore() // Khởi tạo auth store

// --- State cho Bảng ---
const allSuppliers = ref([]) // Lưu danh sách đầy đủ
const loading = ref(true)

// --- State cho Modal ---
const modalVisible = ref(false)
const selectedSupplier = ref(null)

// --- State cho Bộ lọc ---
const searchQuery = ref('')

// --- (Client-side) Lọc dữ liệu ---
const filteredSuppliers = computed(() => {
    if (!searchQuery.value) {
        return allSuppliers.value
    }
    const search = searchQuery.value.toLowerCase()
    return allSuppliers.value.filter(
        (item) =>
            item.name.toLowerCase().includes(search) ||
            item.phone.toLowerCase().includes(search) ||
            (item.email && item.email.toLowerCase().includes(search)) ||
            (item.contactPerson && item.contactPerson.toLowerCase().includes(search))
    )
})

// --- Hàm Tải Dữ liệu ---
const fetchSuppliers = async () => {
    loading.value = true
    try {
        const response = await getAllSuppliers()
        allSuppliers.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải danh sách nhà cung cấp')
    } finally {
        loading.value = false
    }
}

// --- Xử lý CRUD ---
const openCreateModal = () => {
    selectedSupplier.value = null
    modalVisible.value = true
}

const openEditModal = (supplier) => {
    selectedSupplier.value = { ...supplier }
    modalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        await deleteSupplier(id)
        toast.success('Xóa nhà cung cấp thành công!')
        await fetchSuppliers() // Tải lại dữ liệu
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xóa nhà cung cấp'
        toast.error(msg)
    }
}

// Khi modal (thêm/sửa) thành công
const handleModalSuccess = () => {
    fetchSuppliers() // Tải lại bảng
}

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchSuppliers()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.filter-card {
    margin-bottom: 20px;
}
</style>