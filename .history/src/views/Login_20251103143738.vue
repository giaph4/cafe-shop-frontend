<template>
    <div class="login-container">
        <form @submit.prevent="handleLogin" class="login-form">
            <h2>Đăng nhập</h2>
            <div class="form-group">
                <label for="username">Tên đăng nhập (Email)</label>
                <input type="email" id="username" v-model="email" required />
            </div>
            <div class="form-group">
                <label for="password">Mật khẩu</label>
                <input type="password" id="password" v_model="password" required />
            </div>
            <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
            </div>
            <button type="submit" :disabled="isLoading">
                {{ isLoading ? 'Đang xử lý...' : 'Đăng nhập' }}
            </button>
            <div class="register-link">
                Chưa có tài khoản? <router-link to="/register">Đăng ký</router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex'; // <-- Import useStore gốc
// KHÔNG import authStore
// import { authStore } from '@/store/auth';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const store = useStore(); // <-- Lấy store gốc

const handleLogin = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    try {
        // Gọi action với namespace 'auth/login'
        await store.dispatch('auth/login', {
            email: email.value,
            password: password.value,
        });
        // Router sẽ tự động chuyển trang (như trong authModule)
    } catch (err) {
        isLoading.value = false;
        errorMessage.value =
            'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.';
    }
};
</script>

<style scoped>
/* (Giữ nguyên style của bạn) */
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f4f6f8;
}

.login-form {
    width: 350px;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-form h2 {
    text-align: center;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    font-size: 1rem;
    cursor: pointer;
}

button:disabled {
    background-color: #ccc;
}

.error-message {
    color: red;
    margin-bottom: 1rem;
    text-align: center;
}

.register-link {
    text-align: center;
    margin-top: 1rem;
}
</style>