<template>
  <el-dialog
    v-model="dialogVisible"
    title="Đổi mật khẩu"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="150px">
      <el-form-item label="Mật khẩu hiện tại" prop="currentPassword">
        <el-input v-model="form.currentPassword" type="password" show-password></el-input>
      </el-form-item>
      <el-form-item label="Mật khẩu mới" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password></el-input>
      </el-form-item>
      <el-form-item label="Xác nhận mật khẩu mới" prop="confirmationPassword">
        <el-input v-model="form.confirmationPassword" type="password" show-password></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="submitForm">Đổi mật khẩu</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useToast } from 'vue-toastification'
import * as userService from '@/api/userService.js'

const authStore = useAuthStore()
const toast = useToast()

const dialogVisible = ref(true)
const formRef = ref(null)

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmationPassword: '',
})

const rules = reactive({
  currentPassword: [
    { required: true, message: 'Vui lòng nhập mật khẩu hiện tại', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: 'Vui lòng nhập mật khẩu mới', trigger: 'blur' },
    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự', trigger: 'blur' },
  ],
  confirmationPassword: [
    { required: true, message: 'Vui lòng xác nhận mật khẩu mới', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('Mật khẩu xác nhận không khớp'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
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
        await userService.changePassword(authStore.user.id, form)
        toast.success('Đổi mật khẩu thành công!')
        dialogVisible.value = false
        authStore.logout() // Đăng xuất người dùng sau khi đổi mật khẩu
      } catch (error) {
        toast.error('Lỗi khi đổi mật khẩu: ' + (error.response?.data?.message || error.message))
      }
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin.')
      return false
    }
  })
}
</script>
