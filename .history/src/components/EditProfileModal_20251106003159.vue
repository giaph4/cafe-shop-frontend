<template>
  <el-dialog v-model="dialogVisible" title="Chỉnh sửa thông tin cá nhân" width="500px" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="Họ và tên" prop="fullName">
        <el-input v-model="form.fullName"></el-input>
      </el-form-item>
      <el-form-item label="Email" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item label="Số điện thoại" prop="phone">
        <el-input v-model="form.phone"></el-input>
      </el-form-item>

    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="submitForm">Lưu thay đổi</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useToast } from 'vue-toastification'
import * as userService from '@/api/userService.js'
import { getUserById } from '@/api/userService.'

const authStore = useAuthStore()
const toast = useToast()
const user = ref(null)

const dialogVisible = ref(true)
const formRef = ref(null)

onMounted(async () => {
  if (authStore.user?.userId) {
    const res = await getUserById(authStore.user.userId)
    user.value = res.data
  }
})

// Form chỉ chứa 3 trường để user sửa
const form = reactive({
  fullName: '',
  email: '',
  phone: '',
})

// Sửa rules cho phone để khớp với backend
const rules = reactive({
  fullName: [
    { required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
    { type: 'email', message: 'Vui lòng nhập đúng định dạng email', trigger: ['blur', 'change'] },
  ],
  phone: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
    // Rule này khớp với DTO backend
    {
      pattern: /^(\+?84|0)\d{9}$/,
      message: 'Số điện thoại không đúng định dạng (VD: 0987654321)',
      trigger: 'blur',
    },
  ],
})

// Lấy thông tin cũ để hiển thị
onMounted(() => {
  if (user) {
    form.fullName = user.fullName
    form.email = user.email
    form.phone = user.phone
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const submitForm = async () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (valid) {

      // Backend (UserUpdateRequestDTO) yêu cầu 5 trường

      // 1. Lấy roleIds (mảng các số Long) từ authStore
      const roleIds = authStore.user.roles.map(role => role.id);

      // 2. Lấy status (string)
      const status = authStore.user.status;

      // 3. Tạo payload đầy đủ 5 trường
      const updatePayload = {
        ...form,     // fullName, email, phone
        status: status, // status (lấy từ store)
        roleIds: roleIds, // roleIds (lấy từ store)
      };

      try {
        // SỬA LỖI: Gọi đúng hàm "updateUser" (PUT /api/v1/users/{id})
        // Hàm "updateUserProfile" không tồn tại ở Backend
        await userService.updateUser(authStore.user.id, updatePayload)

        await authStore.fetchUserProfile() // Cập nhật lại thông tin người dùng trong store
        toast.success('Cập nhật thông tin thành công!')
        dialogVisible.value = false
      } catch (error) {
        toast.error('Lỗi khi cập nhật thông tin: ' + (error.response?.data?.message || error.message))
      }
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin.')
      return false
    }
  })
}
</script>