<template>
    <div class="login-container">
        <div class="login-left">
            <div class="brand-section">
                <div class="logo-circle">
                    <img src="https://scontent.fsgn2-4.fna.fbcdn.net/v/t39.30808-1/488254814_1121102093151861_7125486509227688983_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=101&ccb=1-7&_nc_sid=e99d92&_nc_eui2=AeHnPNmbK6-RM1CbxwWQo38paUWjPCRSEXFpRaM8JFIRcdM3FgWwO4e7PSxSAT-TceDLibeRE_C9kNJMBxyQj1nK&_nc_ohc=rFGH2zQ6cGgQ7kNvwGjQkMK&_nc_oc=AdkF2QV7mpYqGFVx6XfFO_ab56a-XunhRFBKBFwUUxZ5b6JKY3jBEbrB1Dg2sallJk0&_nc_zt=24&_nc_ht=scontent.fsgn2-4.fna&_nc_gid=pt-PlS4Z9gd_DH2FMDUCKw&oh=00_AfdhxqBTnDBjA250ZVv-RnshlD1bWxe_pC8hI6wYljUfGg&oe=690BFAAE"
                         alt="Coffee Shop Logo" />
                </div>
                <h1 class="brand-title">Coffee BestDN</h1>
                <p class="brand-subtitle">Hệ thống quản lý quán cafe hiện đại</p>
                <div class="features">
                    <div class="feature-item">
                        <span class="feature-icon">☕</span>
                        <span>Quản lý đơn hàng</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span>Báo cáo doanh thu</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">👥</span>
                        <span>Quản lý nhân viên</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="login-right">
            <div class="login-card">
                <div class="card-header">
                    <h2>Đăng nhập</h2>
                    <p>Chào mừng bạn trở lại!</p>
                </div>

                <el-form @submit.prevent="handleLogin" class="login-form">
                    <el-form-item>
                        <label class="form-label">Tên đăng nhập</label>
                        <el-input
                            v-model="username"
                            placeholder="Nhập tên đăng nhập"
                            size="large"
                            prefix-icon="User"
                        />
                    </el-form-item>

                    <el-form-item>
                        <label class="form-label">Mật khẩu</label>
                        <el-input
                            v-model="password"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            show-password
                            size="large"
                            prefix-icon="Lock"
                        />
                    </el-form-item>

                    <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon class="error-alert" />

                    <el-button
                        type="primary"
                        native-type="submit"
                        class="login-button"
                        :loading="loading"
                        size="large"
                    >
                        {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                    </el-button>

                    <div class="demo-accounts">
                        <p class="demo-title">Tài khoản demo:</p>
                        <div class="demo-list">
                            <span class="demo-item">👨‍💼 admin / password123</span>
                            <span class="demo-item">👤 manager01 / password123</span>
                            <span class="demo-item">👤 staff01 / password123</span>
                        </div>
                    </div>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()

const username = ref('admin')
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
    min-height: 100vh;
    background: linear-gradient(135deg, #F5F3F0 0%, #E8E6E3 100%);
}

/* Left Side - Brand */
.login-left {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%);
    color: #FFFFFF;
}

.brand-section {
    max-width: 500px;
    text-align: center;
}

.logo-circle {
    width: 120px;
    height: 120px;
    margin: 0 auto 30px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.logo-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.brand-title {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 16px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.brand-subtitle {
    font-size: 1.25rem;
    opacity: 0.95;
    margin-bottom: 48px;
    font-weight: 500;
}

.features {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 48px;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    font-size: 1.1rem;
    font-weight: 500;
}

.feature-icon {
    font-size: 2rem;
}

/* Right Side - Login Form */
.login-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
}

.login-card {
    width: 100%;
    max-width: 480px;
    background: #FFFFFF;
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.card-header {
    text-align: center;
    margin-bottom: 40px;
}

.card-header h2 {
    font-size: 2rem;
    font-weight: 800;
    color: #212121;
    margin-bottom: 8px;
}

.card-header p {
    font-size: 1rem;
    color: #757575;
    font-weight: 500;
}

.login-form {
    margin-top: 32px;
}

.form-label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #424242;
    margin-bottom: 8px;
}

.error-alert {
    margin-bottom: 24px;
}

.login-button {
    width: 100%;
    height: 50px;
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 24px;
    border-radius: 12px;
}

.demo-accounts {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 2px solid #F5F3F0;
}

.demo-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #757575;
    margin-bottom: 12px;
}

.demo-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.demo-item {
    font-size: 0.875rem;
    color: #9E9E9E;
    padding: 8px 12px;
    background: #F8F6F3;
    border-radius: 8px;
    font-weight: 500;
}

/* Responsive */
@media (max-width: 1024px) {
    .login-left {
        display: none;
    }

    .login-right {
        flex: 1;
    }
}
</style>
