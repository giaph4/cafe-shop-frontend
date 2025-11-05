<template>
    <div class="login-container">
        <form @submit.prevent="handleLogin" class="login-form">
            <h2>Đăng nhập</h2>

            <div class="form-group">
                <label for="username">Tên đăng nhập</label>
                <input type="text" id="username" v-model="username" required />
            </div>

            <div class="form-group">
                <label for="password">Mật khẩu</label>
                <input type="password" id="password" v-model="password" required />
            </div>

            <button type="submit" class="btn-login" :disabled="isLoading">
                {{ isLoading ? 'Đang xử lý...' : 'Đăng nhập' }}
            </button>

            <p v-if="error" class="error-message">{{ error }}</p>

            <div class="register-link">
                Chưa có tài khoản? <router-link to="/register">Đăng ký ngay</router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref(null);

const store = useStore();
const router = useRouter();

// Lấy trạng thái loading từ module 'auth'
const isLoading = computed(() => store.getters['auth/authStatus'] === 'loading');

const handleLogin = async () => {
    error.value = null;
    try {
        const userData = {
            username: username.value,
            password: password.value,
        };
        // Gọi action 'login' trong module 'auth'
        await store.dispatch('auth/login', userData);

        // Đăng nhập thành công, router.push đã được xử lý trong action
        // Hoặc có thể điều hướng ở đây nếu muốn
        // router.push('/'); 

    } catch (err) {
        // Bắt lỗi do action throw ra
        error.value = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        console.error('Login failed:', err);
    }
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
}

.login-form {
    background: white;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}

h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.btn-login {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-login:hover {
    background-color: #0056b3;
}

.btn-login:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.error-message {
    color: #dc3545;
    text-align: center;
    margin-top: 1rem;
}

.register-link {
    text-align: center;
    margin-top: 1rem;
    color: #555;
}

.register-link a {
    color: #007bff;
    text-decoration: none;
    font-weight: 600;
}
</style>