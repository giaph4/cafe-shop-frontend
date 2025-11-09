<template>
    <div class="app-page-container animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <h1 class="page-title">Quản lý Nhà cung cấp</h1>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Thêm Nhà cung cấp
            </el-button>
        </div>

        <el-card class="box-card filter-card">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-input v-model="searchQuery" placeholder="Tìm theo Tên, SĐT, Email,..." clearable />
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable
            :headers="headers"
            :items="filteredSuppliers"
            :loading="loading"
            table-class-name="data-table"
            theme-color="#8B7355"
            show-index
        >
            <template #item-actions="item">
                <el-button type="primary" plain size="small" @click="openEditModal(item)">
                    Sửa
                </el-button>
                <el-popconfirm v-if="authStore.isAdmin" title="Bạn chắc chắn muốn xóa?"
                    confirm-button-text="Đồng ý" cancel-button-text="Hủy" @confirm="handleDelete(item.id)">
                    <template #reference>
                        <el-button type="danger" plain size="small">Xóa</el-button>
                    </template>
                </el-popconfirm>
            </template>
        </EasyDataTable>

        <SupplierFormModal v-model:visible="modalVisible" :supplier="selectedSupplier" @success="handleModalSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth'
import { getAllSuppliers, deleteSupplier } from '@/api/supplierService'
import SupplierFormModal from '@/components/SupplierFormModal.vue'

const toast = useToast()
const authStore = useAuthStore() // Khởi tạo auth store

const allSuppliers = ref([])
const loading = ref(true)

const modalVisible = ref(false)
const selectedSupplier = ref(null)

const searchQuery = ref('')

const headers = [
    { text: "Tên Nhà cung cấp", value: "name", sortable: true },
    { text: "Người liên hệ", value: "contactPerson", sortable: true, width: 180 },
    { text: "Số điện thoại", value: "phone", width: 150 },
    { text: "Email", value: "email", width: 200 },
    { text: "Địa chỉ", value: "address" },
    { text: "Hành động", value: "actions", width: 180 },
]

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

onMounted(() => {
    fetchSuppliers()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
    min-height: 105vh;
}
</style>
