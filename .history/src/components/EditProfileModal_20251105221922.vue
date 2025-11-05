<template>
  <el-dialog
    v-model="dialogVisible"
    title="Chỉnh sửa thông tin cá nhân"
    width="500px"
    @close="handleClose"
  >
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

const authStore = useAuthStore()
const toast = useToast()

const dialogVisible = ref(true)
const formRef = ref(null)

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
})

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
  ],
})

onMounted(() => {
  if (authStore.user) {
    form.fullName = authStore.user.fullName
    form.email = authStore.user.email
    form.phone = authStore.user.phone
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
      try {
        await userService.updateUserProfile(authStore.user.id, form)
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
