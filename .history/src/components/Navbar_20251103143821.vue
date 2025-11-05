<template>
    <nav class="navbar">
        <div class="navbar-left">
            <h1 class="navbar-title">Hệ thống Quản lý</h1>
        </div>
        <div class="navbar-right">
            <div v-if="user" class="user-info">
                <span>Xin chào, <strong>{{ user.fullname }}</strong> ({{ user.role }})</span>
                <button @click="handleLogout" class="logout-button">Đăng xuất</button>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'; // <-- Import useStore gốc

const store = useStore(); // <-- Lấy store gốc

// Lấy getters với namespace 'auth/user'
const user = computed(() => store.getters['auth/user']);

const handleLogout = () => {
    // Gọi action với namespace 'auth/logout'
    store.dispatch('auth/logout');
};
</script>

<style scoped>
/* (Giữ nguyên style của bạn) */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 60px;
    background-color: #ffffff;
    border-bottom: 1px solid #e0e0e0;
}

.navbar-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
}

.navbar-right {
    display: flex;
    align-items: center;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.logout-button {
    padding: 8px 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.logout-button:hover {
    background-color: #d32f2f;
}
</style>