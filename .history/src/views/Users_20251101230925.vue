<template>
    <div class="app-page-container">
      <div class="page-header">
        <h1 class="page-title">Quản lý Nhân viên</h1>
        </div>
  
      <el-card class="box-card">
        <EasyDataTable
          v-model:server-options="serverOptions"
          :server-items-length="serverItemsLength"
          :headers="headers"
          :items="items"
          :loading="loading"
          table-class-name="data-table"
          theme-color="#409EFF"
          buttons-pagination
          show-index
        >
          <template #item-fullName="{ fullName, username }">
            <strong>{{ fullName }}</strong>
            <div style="font-size: 0.85rem; color: #606266;">@{{ username }}</div>
          </template>
          
          <template #item-roles="{ roles }">
            <el-space wrap>
              <el-tag
                v-for="role in roles"
                :key="role.id"
                :type="getRoleType(role.name)"
                effect="light"
              >
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
  
      <UserFormModal
        v-model:visible="modalVisible"
        :user="selectedUser"
        :all-roles="allRoles"
        @success="handleModalSuccess"
      />
  
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import EasyDataTable from 'vue3-easy-data-table'
  import 'vue3-easy-data-table/dist/style.css'
  import { useToast } from 'vue-toastification'
  import { getUsers } from '@/api/userService'
  import { getAllRoles } from '@/api/roleService' // (Cần API này ở backend)
  import UserFormModal from '@/components/UserFormModal.vue'
  
  const toast = useToast()
  
  // --- State cho Bảng ---
  const items = ref([])
  const loading = ref(true)
  const serverItemsLength = ref(0)
  const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'username', // Sắp xếp mặc định
    sortType: 'asc',
  })
  
  // --- State cho Modal ---
  const modalVisible = ref(false)
  const selectedUser = ref(null)
  const allRoles = ref([]) // Danh sách tất cả các role
  
  // --- Định nghĩa Cột cho Bảng ---
  const headers = [
    { text: "Nhân viên", value: "fullName" },
    { text: "Số điện thoại", value: "phone", width: 120 },
    { text: "Email", value: "email" },
    { text: "Quyền", value: "roles", width: 200 },
    { text: "Trạng thái", value: "status", width: 120 },
    { text: "Ngày tham gia", value: "createdAt", width: 120 },
    { text: "Hành động", value: "actions", width: 200 },
  ]
  
  // --- Hàm Tải Dữ liệu Chính (Users) ---
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
  
  // --- Hàm Tải Danh sách Roles (Cho Modal) ---
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
  
  // --- Xử lý CRUD ---
  const openEditModal = (user) => {
    selectedUser.value = { ...user } // DTO Response đã có roles
    modalVisible.value = true
  }
  
  // Khi modal sửa thành công
  const handleModalSuccess = () => {
    fetchUsers() // Tải lại bảng
  }
  
  // --- Helper (Tô màu Tag) ---
  const getRoleType = (roleName) => {
    if (roleName === 'ROLE_ADMIN') return 'danger'
    if (roleName === 'ROLE_MANAGER') return 'warning'
    return 'primary' // ROLE_STAFF
  }
  
  // --- Theo dõi khi serverOptions thay đổi (click phân trang / sort) ---
  watch(serverOptions, (newValue, oldValue) => {
    fetchUsers()
  }, { deep: true })
  
  // --- Tải dữ liệu khi trang được mở ---
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