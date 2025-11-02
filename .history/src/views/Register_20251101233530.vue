<template>
    <div class="register-container">
        <el-card class="register-card">
            <template #header>
                <div class="card-header">
                    <span>☕ Đăng ký Tài khoản Nhân viên</span>
                </div>
            </template>

            <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
                <el-form-item label="Họ và Tên" prop="fullName">
                    <el-input v-model="formData.fullName" placeholder="Nguyễn Văn A" />
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="Tên đăng nhập" prop="username">
                            <el-input v-model="formData.username" placeholder="staff01" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Số điện thoại" prop="phone">
                            <el-input v-model="formData.phone" placeholder="0901234567" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="Email" prop="email">
                    <el-input v-model="formData.email" placeholder="staff01@example.com" />
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="Mật khẩu" prop="password">
                            <el-input v-model="formData.password" type="password" show-password />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Xác nhận Mật khẩu" prop="confirmationPassword">
                            <el-input v-model="formData.confirmationPassword" type="password" show-password />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon class="mb-3" />

                <el-form-item>
                    <el-button type="primary" class="w-100" :loading="loading" @click.prevent="handleRegister">
                        Đăng ký
                    </el-button>
                </el-form-item>

                <div class="login-link">
                    <router-link :to="{ name: 'Login' }">
                        Đã có tài khoản? Đăng nhập ngay
                    </router-link>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth.js' // Sửa: import từ auth.js
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()
const formRef = ref(null)

const formData = ref({
    username: '',
    password: '',
    confirmationPassword: '',
    fullName: '',
    email: '',
    phone: '',
})
const loading = ref(false)
const errorMsg = ref(null)

// --- Validation Rules ---
const validatePassConfirm = (rule, value, callback) => {
    if (value === '') {
        callback(new Error('Vui lòng xác nhận mật khẩu'))
    } else if (value !== formData.value.password) {
        callback(new Error('Mật khẩu xác nhận không khớp'))
    } else {
        callback()
    }
}

// Lấy regex từ DTO [cite: giaph4/cafe-shop-backend/cafe-shop-backend-0a2a327b746e18257452b0f82b74bc84858fdcc6/src/main/java/com/giapho/coffee_shop_backend/dto/UserUpdateRequestDTO.java]
const validatePhone = (rule, value, callback) => {
    const phoneRegex = /^(\+?84|0)\d{9}$/
    if (!value) {
        callback(new Error('Số điện thoại là bắt buộc'))
    } else if (!phoneRegex.test(value)) {
        callback(new Error('Định dạng SĐT Việt Nam không hợp lệ (0xxxxxxxxx)'))
    } else {
        callback()
    }
}

const formRules = {
    // Rules dựa trên RegisterRequest.java [cite: giaph4/cafe-shop-backend/cafe-shop-backend-0a2a327b746e18257452b0f82b74bc84858fdcc6/src/main/java/com/giapho/coffee_shop_backend/dto/RegisterRequest.java]
    fullName: [{ required: true, message: 'Họ tên là bắt buộc', trigger: 'blur' }],
    username: [
        { required: true, message: 'Tên đăng nhập là bắt buộc', trigger: 'blur' },
        { min: 3, max: 50, message: 'Tên đăng nhập từ 3-50 ký tự', trigger: 'blur' }
    ],
    phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
    email: [
        { required: true, message: 'Email là bắt buộc', trigger: 'blur' },
        { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }
    ],
    password: [
        { required: true, message: 'Mật khẩu là bắt buộc', trigger: 'blur' },
        { min: 6, max: 100, message: 'Mật khẩu phải từ 6 ký tự trở lên', trigger: 'blur' }
    ],
    confirmationPassword: [
        { required: true, validator: validatePassConfirm, trigger: 'blur' }
    ],
}

const handleRegister = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            errorMsg.value = null
            try {
                // DTO không cần confirmationPassword
                const userData = {
                    username: formData.value.username,
                    password: formData.value.password,
                    fullName: formData.value.fullName,
                    email: formData.value.email,
                    phone: formData.value.phone,
                }

                await authStore.register(userData)

                toast.success(`Đăng ký thành công! Chào mừng ${userData.fullName}!`)
                // authStore sẽ tự động điều hướng đến Dashboard

            } catch (error) {
                // Bắt lỗi 400 (IllegalArgumentException) nếu SĐT/Email/Username trùng
                // [cite: giaph4/cafe-shop-backend/cafe-shop-backend-0a2a327b746e18257452b0f82b74bc84858fdcc6/src/main/java/com/giapho/coffee_shop_backend/service/AuthenticationService.java]
                const msg = error.response?.data?.message || 'Lỗi khi đăng ký'
                errorMsg.value = msg
                toast.error(msg)
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
}

.register-card {
    width: 600px;
}

.card-header {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
}

.w-100 {
    width: 100%;
}

.mb-3 {
    margin-bottom: 1rem;
}

.login-link {
    text-align: center;
    margin-top: 15px;
}

.login-link a {
    color: var(--el-color-primary);
    text-decoration: none;
}

.login-link a:hover {
    text-decoration: underline;
}
</style>