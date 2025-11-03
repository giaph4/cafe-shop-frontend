<template>
    <div class="login-container">
        <el-card class="login-card">
            <template #header>
                <div class="card-header">
                    <span>☕ Coffee Shop Login</span>
                </div>
            </template>

            <el-form @submit.prevent="handleLogin">
                <el-form-item label="Tên đăng nhập">
                    <el-input v-model="username" placeholder="admin / manager01 / staff01" />
                </el-form-item>

                <el-form-item label="Mật khẩu">
                    <el-input v-model="password" type="password" placeholder="password123" show-password />
                </el-form-item>

                <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon class="mb-3" />

                <el-form-item>
                    <el-button type="primary" native-type="submit" class="w-100" :loading="loading">
                        Đăng nhập
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()

const username = ref('admin') // Mặc định để test
const password = ref('password123')
const loading = ref(false)
const errorMsg = ref(null)

const handleLogin = async () => {
    loading.value = true
    errorMsg.value = null
    try {
        await authStore.login({
            username: username.value,
            password: password.value,
        })

        // Auth store (đã sửa) sẽ tự động giải mã token và lấy tên
        toast.success(`Chào mừng trở lại, ${authStore.userFullName}!`)
        // Điều hướng đã được xử lý trong authStore

    } catch (error) {
        console.error(error);
        const apiError = error.response?.data?.message || 'Lỗi đăng nhập. Vui lòng thử lại.';
        errorMsg.value = apiError;
        toast.error(apiError);
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
}

.login-card {
    width: 400px;
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
</style>