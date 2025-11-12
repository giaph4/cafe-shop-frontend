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
            <el-form-item label="Ảnh đại diện">
                <div class="avatar-control">
                    <el-avatar :size="96" :src="avatarPreview" class="avatar-preview"/>
                    <div class="avatar-actions">
                        <el-upload
                            ref="avatarUploadRef"
                            action="#"
                            :auto-upload="false"
                            :show-file-list="false"
                            accept="image/png, image/jpeg, image/webp"
                            :disabled="uploadingAvatar"
                            :on-change="handleAvatarChange"
                        >
                            <el-button type="primary" :loading="uploadingAvatar" plain>Tải ảnh mới</el-button>
                        </el-upload>
                        <el-button type="danger" link @click="handleAvatarRemove" :disabled="uploadingAvatar" v-if="form.avatarUrl">
                            Xóa ảnh hiện tại
                        </el-button>
                    </div>
                </div>
                <div class="avatar-url-wrapper">
                    <el-input
                        :model-value="form.avatarUrl ?? ''"
                        placeholder="Hoặc dán URL ảnh (tùy chọn)"
                        @input="onAvatarUrlInput"
                        clearable
                    />
                    <p class="helper-text">Để bỏ ảnh, nhấn "Xóa ảnh hiện tại" hoặc xóa URL rồi lưu.</p>
                    <p v-if="avatarError" class="avatar-error">{{ avatarError }}</p>
                </div>
            </el-form-item>

            <el-form-item label="Họ và tên" prop="fullName">
                <el-input v-model="form.fullName"></el-input>
            </el-form-item>

            <el-form-item label="Email" prop="email">
                <el-input v-model="form.email"></el-input>
            </el-form-item>

            <el-form-item label="Số điện thoại" prop="phone">
                <el-input v-model="form.phone"></el-input>
            </el-form-item>

            <el-form-item label="Địa chỉ">
                <el-input
                    v-model="form.address"
                    type="textarea"
                    :rows="2"
                    placeholder="Ví dụ: 123 Trần Hưng Đạo, Tp. Đà Nẵng"
                    clearable
                />
                <p class="helper-text">Để xóa địa chỉ, để trống trường này.</p>
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
import {ref, reactive, onMounted, computed} from 'vue'
import {useAuthStore} from '@/store/auth'
import {useToast} from 'vue-toastification'
import * as userService from '@/api/userService.js'
import {uploadFile} from '@/api/fileService'

const authStore = useAuthStore()
const toast = useToast()

const dialogVisible = ref(true)
const formRef = ref(null)
const avatarUploadRef = ref(null)
const user = ref(null)
const uploadingAvatar = ref(false)
const avatarError = ref(null)

// dữ liệu form đầy đủ
const form = reactive({
    id: null,
    username: '',
    fullName: '',
    email: '',
    phone: '',
    status: '',
    roles: [],
    avatarUrl: null,
    address: '',
    removeAvatar: false
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
    form.avatarUrl = u.avatarUrl || null
    form.address = u.address || ''
    form.removeAvatar = false
    avatarError.value = null
}

const generatedAvatar = computed(() => {
    const nameSeed = encodeURIComponent(form.fullName || form.username || 'user')
    return `https://avatar.iran.liara.run/username?username=${nameSeed}`
})

const avatarPreview = computed(() => form.avatarUrl || generatedAvatar.value)

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

        const trimmedAvatarUrl = form.avatarUrl ? form.avatarUrl.trim() : null
        const trimmedAddress = form.address?.trim?.() ?? ''

        const payload = {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            status: form.status,
            roleIds: form.roles.map(r => r.id),
            avatarUrl: trimmedAvatarUrl,
            removeAvatar: form.removeAvatar,
            address: trimmedAddress || null
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

const handleAvatarChange = async (uploadFileItem) => {
    if (!uploadFileItem?.raw) return

    avatarError.value = null

    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(uploadFileItem.raw.type)
    const isLt2M = uploadFileItem.raw.size / 1024 / 1024 < 2

    if (!isValidType) {
        avatarError.value = 'Chỉ hỗ trợ các định dạng JPG, PNG hoặc WEBP.'
        toast.error(avatarError.value)
        avatarUploadRef.value?.clearFiles()
        return
    }

    if (!isLt2M) {
        avatarError.value = 'Ảnh đại diện phải nhỏ hơn 2MB.'
        toast.error(avatarError.value)
        avatarUploadRef.value?.clearFiles()
        return
    }

    uploadingAvatar.value = true

    try {
        const response = await uploadFile(uploadFileItem.raw)
        const uploadedUrl = response.data?.fileUrl || response.data?.url || response.data?.link

        if (!uploadedUrl) {
            throw new Error('Hệ thống không trả về đường dẫn ảnh.')
        }

        form.avatarUrl = uploadedUrl
        form.removeAvatar = false
        toast.success('Tải ảnh đại diện thành công!')
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Không thể tải ảnh đại diện.'
        toast.error(message)
    } finally {
        uploadingAvatar.value = false
        avatarUploadRef.value?.clearFiles()
    }
}

const handleAvatarRemove = () => {
    form.avatarUrl = null
    form.removeAvatar = true
    avatarError.value = null
}

const onAvatarUrlInput = (value) => {
    form.avatarUrl = value || null
    form.removeAvatar = !(value && value.trim())
    avatarError.value = null
}
</script>

<style>
.me-1 {
    margin-right: 6px;
}

.avatar-control {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
}

.avatar-preview {
    border: 2px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.avatar-url-wrapper {
    margin-top: 8px;
}

.helper-text {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
}

.avatar-error {
    margin-top: 4px;
    font-size: 12px;
    color: #f56c6c;
}
</style>
