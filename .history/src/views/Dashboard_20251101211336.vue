<template>
    <div>
        <h1>Dashboard</h1>
        <p>Chào mừng bạn đến với trang quản lý.</p>

        <div v-if="authStore.user">
            <p>Bạn đã đăng nhập với tư cách: <strong>{{ authStore.user.username }}</strong></p>
            <button @click="handleLogout">Đăng xuất</button>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();

const handleLogout = () => {
    authStore.logout();
}
</script>