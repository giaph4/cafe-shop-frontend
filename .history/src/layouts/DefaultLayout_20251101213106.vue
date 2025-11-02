<template>
    <el-container class="app-layout">
        <Sidebar />

        <el-container class="main-container" direction="vertical">
            <Navbar />

            <el-main class="app-main">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import Navbar from '@/components/Navbar.vue'
</script>

<style scoped>
.app-layout {
    height: 100vh;
    background-color: var(--app-bg-color);
}

.main-container {
    overflow: hidden;
}

.app-main {
    /* 60px là chiều cao của Navbar */
    height: calc(100vh - 60px);
    overflow-y: auto;
    /* padding đã bị xóa bởi main.css, chúng ta sẽ thêm padding trong từng view */
}

/* --- Hiệu ứng chuyển trang --- */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>