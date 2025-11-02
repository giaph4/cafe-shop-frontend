<template>
    <div class="app-page-container">
      <div class="page-header">
        <h1 class="page-title">Quản lý Danh mục</h1>
        <el-button type="primary" @click="openCreateModal">
          <el-icon style="margin-right: 8px;"><Plus /></el-icon>
          Thêm Danh mục
        </el-button>
      </div>
  
      <el-card class="box-card">
        <el-table :data="categories" v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="Tên Danh mục" sortable />
          <el-table-column prop="description" label="Mô tả" />
          
          <el-table-column label="Hành động" width="180" align="right">
            <template #default="scope">
              <el-button type="primary" plain size="small" @click="openEditModal(scope.row)">
                Sửa
              </el-button>
              <el-popconfirm
                title="Bạn chắc chắn muốn xóa?"
                confirm-button-text="Đồng ý"
                cancel-button-text="Hủy"
                @confirm="handleDelete(scope.row.id)"
              >
                <template #reference>
                  <el-button type="danger" plain size="small">Xóa</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <CategoryModal
        v-model:visible="modalVisible"
        :category="selectedCategory"
        @success="handleModalSuccess"
      />
  
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useToast } from 'vue-toastification'
  import { Plus } from '@element-plus/icons-vue'
  import { getAllCategories, deleteCategory } from '@/api/categoryService'
  import CategoryModal from '@/components/CategoryModal.vue'
  
  const toast = useToast()
  
  // --- State cho Bảng ---
  const categories = ref([])
  const loading = ref(true)
  
  // --- State cho Modal ---
  const modalVisible = ref(false)
  const selectedCategory = ref(null)
  
  // --- Hàm Tải Dữ liệu ---
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
  
  // --- Xử lý CRUD ---
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
  
  // --- Tải dữ liệu khi trang được mở ---
  onMounted(() => {
    fetchCategories()
  })
  </script>
  
  <style scoped>
  .app-page-container {
    padding: 20px;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  </style>