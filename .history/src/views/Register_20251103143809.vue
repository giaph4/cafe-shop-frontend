<template>
    <div class="register-container">
      <form @submit.prevent="handleRegister" class="register-form">
        <h2>Đăng ký tài khoản</h2>
        <div class="form-group">
          <label for="fullname">Họ và tên</label>
          <input type="text" id="fullname" v-model="fullname" required />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <input type="password" id="password" v_model="password" required />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Xác nhận Mật khẩu</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" required />
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Đang xử lý...' : 'Đăng ký' }}
        </button>
        <div class="login-link">
          Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link>
        </div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useStore } from 'vuex'; // <-- Import useStore gốc
  
  const fullname = ref('');
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const errorMessage = ref('');
  const isLoading = ref(false);
  
  const store = useStore(); // <-- Lấy store gốc
  
  const handleRegister = async () => {
    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Mật khẩu xác nhận không khớp.';
      return;
    }
    
    isLoading.value = true;
    errorMessage.value = '';
    
    try {
      // Gọi action với namespace 'auth/register'
      await store.dispatch('auth/register', {
        fullname: fullname.value,
        email: email.value,
        password: password.value,
      });
      // Router sẽ tự động chuyển trang (như trong authModule)
    } catch (err) {
      isLoading.value = false;
      errorMessage.value = err.response?.data?.message || 'Đăng ký thất bại. Email có thể đã tồn tại.';
    }
  };
  </script>
  
  <style scoped>
  /* (Giữ nguyên style của bạn, tương tự trang Login) */
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f4f6f8;
  }
  .register-form {
    width: 400px;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .register-form h2 {
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
  .login-link {
    text-align: center;
    margin-top: 1rem;
  }
  </style>