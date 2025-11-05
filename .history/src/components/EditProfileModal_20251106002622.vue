<template>
  <el-dialog
    v-model="dialogVisible"
    title="Chỉnh sửa thông tin cá nhân"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="Họ và tên" prop="fullName">
        <el-input v-model="form.fullName" />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input v-model="form.email" />
      </el-form-item>

      <el-form-item label="Số điện thoại" prop="phone">
        <el-input v-model="form.phone" />
      </el-form-item>

      <el-form-item label="Tên đăng nhập">
        <el-input v-model="form.username" disabled />
      </el-form-item>

      <el-form-item label="Trạng thái">
        <el-input v-model="form.status" disabled />
      </el-form-item>

      <el-form-item label="Vai trò">
        <div>
          <el-tag v-for="r in form.roles" :key="r.id" class="role-tag">
            {{ r.name }}
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
import { ref, reactive, watch, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useToast } from 'vue-toastification'
import * as userService from '@/api/userService.js'
import { getUserById } from '@/api/userService'

const authStore = useAuthStore()
const toast = useToast()

// điều khiển modal từ parent hoặc component
const dialogVisible = ref(false)
const formRef = ref(null)
const user = ref(null)

// form chứa đầy đủ các trường cần hiển thị/ghi nhận
const form = reactive({
  id: null,
  username: '',
  fullName: '',
  email: '',
  phone: '',
  status: '',
  roles: []
})

const rules = reactive({
  fullName: [{ required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur' }],
  email: [
    { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
    { type: 'email', message: 'Vui lòng nhập đúng định dạng email', trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
    { pattern: /^(\+?84|0)\d{9}$/, message: 'Số điện thoại không đúng định dạng', trigger: 'blur' }
  ]
})

const emit = defineEmits(['close'])

// khi component mount, nếu store có user thì lưu tạm user
onMounted(async () => {
  if (authStore.user) {
    // ưu tiên dùng store user nếu đã đầy đủ
    fillFormFromSource(authStore.user)
  }
})

// nếu modal mở thì nạp dữ liệu mới từ store hoặc từ API
watch(dialogVisible, async (visible) => {
  if (!visible) return
  // nếu store không có đủ thông tin, gọi API
  const id = authStore.user?.id ?? authStore.user?.userId
  if (id) {
    try {
      const res = await getUserById(id)
      user.value = res.data
      fillFormFromSource(user.value)
    } catch (e) {
      // fallback dùng store nếu API lỗi
      if (authStore.user) fillFormFromSource(authStore.user)
    }
  } else if (authStore.user) {
    fillFormFromSource(authStore.user)
  }
})

// helper điền form từ nguồn user object
function fillFormFromSource(src) {
  form.id = src.id ?? src.userId ?? null
  form.username = src.username ?? ''
  form.fullName = src.fullName ?? ''
  form.email = src.email ?? ''
  form.phone = src.phone ?? ''
  form.status = src.status ?? ''
  // đảm bảo roles là mảng object {id, name}
  form.roles = Array.isArray(src.roles) ? src.roles : []
}

const handleClose = () => {
  emit('close')
  dialogVisible.value = false
}

// submit: gọi API update, sau đó cập nhật store
const submitForm = async () => {
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
      const idToUpdate = form.id ?? (authStore.user?.id ?? authStore.user?.userId)
      const res = await userService.updateUser(idToUpdate, payload)
      const updated = res.data

      // cập nhật store: nếu store có setUser thì dùng, nếu không gọi fetchUserProfile
      if (typeof authStore.setUser === 'function') {
        authStore.setUser(updated)
      } else if (typeof authStore.fetchUserProfile === 'function') {
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

<style scoped>
.role-tag {
  margin-right: 6px;
}
</style>
