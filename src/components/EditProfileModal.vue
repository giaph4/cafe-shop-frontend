<template>
  <el-dialog
      v-model="dialogVisible"
      title="Chỉnh sửa thông tin cá nhân"
      width="500px"
      @close="handleClose"
  >
    <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="120px"
    >
      <el-form-item label="Họ và tên" prop="fullName">
        <el-input v-model="form.fullName"></el-input>
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>

      <el-form-item label="Số điện thoại" prop="phone">
        <el-input v-model="form.phone"></el-input>
      </el-form-item>

      <el-form-item label="Tên đăng nhập">
        <el-input v-model="form.username" disabled></el-input>
      </el-form-item>

      <el-form-item label="Trạng thái">
        <el-input v-model="form.status" disabled></el-input>
      </el-form-item>

      <el-form-item label="Vai trò">
        <div>
          <el-tag
              v-for="role in form.roles"
              :key="role.id"
              class="me-1"
              type="success"
          >
            {{ role.name }}
          </el-tag>
        </div>
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
import {ref, reactive, onMounted} from 'vue'
import {useAuthStore} from '@/store/auth'
import {useToast} from 'vue-toastification'
import * as userService from '@/api/userService.js'

const authStore = useAuthStore()
const toast = useToast()

const dialogVisible = ref(true)
const formRef = ref(null)
const user = ref(null)

// dữ liệu form đầy đủ
const form = reactive({
  id: null,
  username: '',
  fullName: '',
  email: '',
  phone: '',
  status: '',
  roles: []
})

// validate
const rules = reactive({
  fullName: [{required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur'}],
  email: [
    {required: true, message: 'Vui lòng nhập email', trigger: 'blur'},
    {type: 'email', message: 'Vui lòng nhập đúng định dạng email', trigger: ['blur', 'change']}
  ],
  phone: [
    {required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur'},
    {pattern: /^(\+?84|0)\d{9}$/, message: 'Số điện thoại không đúng định dạng (VD: 0987654321)', trigger: 'blur'}
  ]
})

// lấy dữ liệu user khi mở form
onMounted(async () => {
  try {
    const id = authStore.user?.id || authStore.user?.userId
    if (!id) return
    const res = await userService.getUserById(id)
    user.value = res.data
    fillForm(user.value)
  } catch (e) {
    if (authStore.user) fillForm(authStore.user)
  }
})

// fill dữ liệu vào form
function fillForm(u) {
  form.id = u.id
  form.username = u.username
  form.fullName = u.fullName
  form.email = u.email
  form.phone = u.phone
  form.status = u.status
  form.roles = Array.isArray(u.roles) ? u.roles : []
}

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}

// gửi dữ liệu cập nhật
async function submitForm() {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) {
      toast.error('Vui lòng kiểm tra lại thông tin.')
      return
    }

    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      status: form.status,
      roleIds: form.roles.map(r => r.id)
    }

    try {
      const id = form.id || authStore.user?.id || authStore.user?.userId
      await userService.updateUser(id, payload)

      // Cập nhật lại store
      if (authStore.fetchUserProfile) {
        await authStore.fetchUserProfile()
      }

      toast.success('Cập nhật thông tin thành công!')
      dialogVisible.value = false
      emit('close')
    } catch (error) {
      toast.error('Lỗi khi cập nhật thông tin: ' + (error.response?.data?.message || error.message))
    }
  })
}
</script>

<style>
.me-1 {
  margin-right: 6px;
}
</style>
