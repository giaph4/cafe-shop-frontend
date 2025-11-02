<template>
    <el-dialog
      :model-value="visible"
      @update:model-value="$emit('update:visible', $event)"
      title="Cập nhật thông tin Nhân viên"
      width="500px"
      @close="onClose"
      :close-on-click-modal="false"
    >
      <div v-if="!formData" v-loading="true" style="height: 200px;"></div>
      
      <el-form
        v-else
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        v-loading="loading"
      >
        <el-form-item label="Tên đăng nhập (Username)">
          <el-input :value="user ? user.username : ''" disabled />
        </el-form-item>
  
        <el-form-item label="Họ và Tên" prop="fullName">
          <el-input v-model="formData.fullName" />
        </el-form-item>
  
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Số điện thoại" prop="phone">
              <el-input v-model="formData.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Trạng thái" prop="status">
              <el-select v-model="formData.status" class="w-100">
                <el-option label="Đang hoạt động (ACTIVE)" value="ACTIVE" />
                <el-option label="Vô hiệu hóa (INACTIVE)" value="INACTIVE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Email" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
  
        <el-form-item label="Phân Quyền (Roles)" prop="roleIds">
          <el-select
            v-model="formData.roleIds"
            placeholder="Chọn các quyền cho nhân viên"
            class="w-100"
            multiple
          >
            <el-option
              v-for="role in allRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        
      </el-form>
  
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="$emit('update:visible', false)">Hủy</el-button>
          <el-button type="primary" @click="submitForm" :loading="loading">
            Lưu thay đổi
          </el-button>
        </span>
      </template>
    </el-dialog>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue'
  import { useToast } from 'vue-toastification'
  import { updateUser } from '@/api/userService'
  
  const props = defineProps({
    visible: Boolean,
    user: Object, // Dữ liệu User (luôn là edit)
    allRoles: Array, // Danh sách tất cả roles (từ trang cha)
  })
  
  const emit = defineEmits(['update:visible', 'success'])
  
  const toast = useToast()
  const formRef = ref(null)
  const loading = ref(false)
  
  // --- State cho Form ---
  const formData = ref(null)
  
  // --- Validation Rules ---
  // Dựa trên UserUpdateRequestDTO.java
  const validatePhone = (rule, value, callback) => {
    const phoneRegex = /^(\+?84|0)\d{9}$/
    if (!value) {
      callback(new Error('Số điện thoại là bắt buộc'))
    } else if (!phoneRegex.test(value)) {
      callback(new Error('Định dạng SĐT Việt Nam không hợp lệ'))
    } else {
      callback()
    }
  }
  
  const formRules = {
    fullName: [{ required: true, message: 'Họ tên là bắt buộc', trigger: 'blur' }],
    phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
    email: [{ required: true, message: 'Email là bắt buộc', trigger: 'blur' },
            { type: 'email', message: 'Định dạng email không hợp lệ', trigger: 'blur' }],
    status: [{ required: true, message: 'Trạng thái là bắt buộc', trigger: 'change' }],
    roleIds: [{ required: true, type: 'array', min: 1, message: 'Phải có ít nhất 1 quyền', trigger: 'change' }],
  }
  
  // --- Xử lý Form ---
  const submitForm = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true
        try {
          // DTO backend yêu cầu
          const userData = {
            fullName: formData.value.fullName,
            phone: formData.value.phone,
            email: formData.value.email,
            status: formData.value.status,
            roleIds: formData.value.roleIds,
          }
          
          await updateUser(props.user.id, userData)
          toast.success('Cập nhật nhân viên thành công!')
          
          emit('success')
          emit('update:visible', false)
          
        } catch (error) {
          // Bắt lỗi 400 (IllegalArgumentException) nếu SĐT/Email trùng
          const msg = error.response?.data?.message || 'Lỗi khi cập nhật'
          toast.error(msg)
        } finally {
          loading.value = false
        }
      }
    })
  }
  
  // --- Reset Form khi đóng ---
  const onClose = () => {
    formData.value = null
    formRef.value?.resetFields()
  }
  
  // --- Theo dõi khi props.user thay đổi ---
  watch(() => props.user, (newUser) => {
    if (newUser) {
      // Đang Edit: Đổ dữ liệu vào form
      formData.value = {
        fullName: newUser.fullName,
        phone: newUser.phone,
        email: newUser.email,
        status: newUser.status,
        // UserResponseDTO trả về Set<RoleDTO>
        roleIds: newUser.roles.map(role => role.id), // Chuyển thành mảng các ID
      }
    } else {
      onClose()
    }
  })
  </script>
  
  <style scoped>
  .w-100 {
    width: 100%;
  }
  </style>