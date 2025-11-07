<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Nhân viên</h1>
            <el-button type="primary" @click="openRegisterModal">Thêm Nhân viên</el-button>
        </div>

        <el-card class="box-card filter-card">
            <template #header>
                <span>🔍 Tìm kiếm & Lọc</span>
            </template>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-input
                        v-model="searchQuery"
                        placeholder="Tìm theo tên hoặc username..."
                        clearable
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="6">
                    <el-select
                        v-model="filterRole"
                        placeholder="Lọc theo vai trò"
                        clearable
                        class="w-100"
                    >
                        <el-option label="Tất cả" value="" />
                        <el-option label="Admin" value="ROLE_ADMIN" />
                        <el-option label="Staff" value="ROLE_STAFF" />
                    </el-select>
                </el-col>
                <el-col :span="6">
                    <el-select
                        v-model="filterStatus"
                        placeholder="Lọc theo trạng thái"
                        clearable
                        class="w-100"
                    >
                        <el-option label="Tất cả" value="" />
                        <el-option label="Active" value="ACTIVE" />
                        <el-option label="Inactive" value="INACTIVE" />
                    </el-select>
                </el-col>
            </el-row>
        </el-card>

        <el-card class="box-card">
            <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
                :headers="headers" :items="filteredItems" :loading="loading" table-class-name="data-table" theme-color="#8B7355"
                buttons-pagination show-index>
                <template #item-fullName="{ fullName, username }">
                    <strong>{{ fullName }}</strong>
                    <div style="font-size: 0.85rem; color: #606266;">@{{ username }}</div>
                </template>

                <template #item-roles="{ roles }">
                    <el-space wrap>
                        <el-tag v-for="role in roles" :key="role.id" :type="getRoleType(role.name)" effect="light">
                            {{ role.name.replace('ROLE_', '') }}
                        </el-tag>
                    </el-space>
                </template>

                <template #item-status="{ status }">
                    <el-tag :type="status === 'ACTIVE' ? 'success' : 'danger'">
                        {{ status }}
                    </el-tag>
                </template>

                <template #item-createdAt="{ createdAt }">
                    {{ createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : 'N/A' }}
                </template>

                <template #item-actions="item">
                    <el-button type="primary" plain size="small" @click="openEditModal(item)">
                        Sửa Quyền/Trạng thái
                    </el-button>
                </template>
            </EasyDataTable>
        </el-card>

        <UserFormModal v-model:visible="modalVisible" :user="selectedUser" :all-roles="allRoles"
            @success="handleModalSuccess" />

        <UserRegisterModal v-model:visible="registerModalVisible" @success="handleRegisterSuccess" />

    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Search } from '@element-plus/icons-vue'
import { getUsers } from '@/api/userService'
import UserFormModal from '@/components/UserFormModal.vue'
import UserRegisterModal from '@/components/UserRegisterModal.vue'

const toast = useToast()

const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')

const filteredItems = computed(() => {
    let result = items.value
    
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(item =>
            item.fullName.toLowerCase().includes(query) ||
            item.username.toLowerCase().includes(query)
        )
    }
    
    if (filterRole.value) {
        result = result.filter(item =>
            item.roles.some(role => role.name === filterRole.value)
        )
    }
    
    if (filterStatus.value) {
        result = result.filter(item => item.status === filterStatus.value)
    }
    
    return result
})

const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'username',
    sortType: 'asc',
})

const modalVisible = ref(false)
const registerModalVisible = ref(false)
const selectedUser = ref(null)
const allRoles = ref([]) // Danh sách tất cả các role

const headers = [
    { text: "Nhân viên", value: "fullName" },
    { text: "Số điện thoại", value: "phone", width: 120 },
    { text: "Email", value: "email" },
    { text: "Quyền", value: "roles", width: 200 },
    { text: "Trạng thái", value: "status", width: 120 },
    { text: "Ngày tham gia", value: "createdAt", width: 120 },
    { text: "Hành động", value: "actions", width: 200 },
]

const fetchUsers = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            sort: `${serverOptions.value.sortBy},${serverOptions.value.sortType}`,
        }

        const response = await getUsers(params)

        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách nhân viên')
    } finally {
        loading.value = false
    }
}

const fetchRoles = async () => {
    try {
        // TẠM THỜI GIẢ ĐỊNH API CHƯA CÓ, HARD-CODE 3 ROLES
        // (Xóa/Comment đoạn hard-code này khi bạn đã thêm API GET /api/v1/roles)
        allRoles.value = [
            { id: 1, name: 'ROLE_STAFF' },
            { id: 2, name: 'ROLE_MANAGER' },
            { id: 3, name: 'ROLE_ADMIN' },
        ]

        // (Mở comment đoạn code này khi có API)
        // const response = await getAllRoles()
        // allRoles.value = response.data

    } catch (error) {
        toast.error('Lỗi khi tải danh sách quyền (Roles)')
        console.error("Backend đang thiếu API GET /api/v1/roles. Đang dùng dữ liệu giả định.")
    }
}

const openEditModal = (user) => {
    selectedUser.value = { ...user } // DTO Response đã có roles
    modalVisible.value = true
}

const openRegisterModal = () => {
    registerModalVisible.value = true
}

// Khi modal sửa thành công
const handleModalSuccess = () => {
    fetchUsers() // Tải lại bảng
}

const handleRegisterSuccess = () => {
    registerModalVisible.value = false // Đóng modal đăng ký
    fetchUsers() // Tải lại bảng sau khi đăng ký thành công
}

const getRoleType = (roleName) => {
    if (roleName === 'ROLE_ADMIN') return 'danger'
    if (roleName === 'ROLE_MANAGER') return 'warning'
    return 'primary' // ROLE_STAFF
}

watch(serverOptions, (newValue, oldValue) => {
    fetchUsers()
}, { deep: true })

onMounted(() => {
    fetchRoles() // Tải danh sách quyền trước
    fetchUsers() // Sau đó tải danh sách nhân viên
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.data-table {
    --easy-table-header-font-size: 14px;
    --easy-table-header-font-weight: 600;
    --easy-table-body-row-font-size: 14px;
}
</style>
