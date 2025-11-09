<template>
    <el-container class="app-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
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
import { computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Navbar from '@/components/Navbar.vue'
import { useSidebarStore } from '@/store/sidebar'

const sidebarStore = useSidebarStore()

const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed)
</script>

<style scoped>
.app-layout {
    height: 100vh;
    background: #F8F9FA;
}

.app-layout.sidebar-collapsed .main-container {
    transition: margin-left 0.25s ease;
}

.main-container {
    overflow: hidden;
    background: #F8F9FA;
    transition: margin-left 0.25s ease;
}

.app-main {
    height: calc(100vh - 70px);
    overflow-y: auto;
    background: #F8F9FA;
    padding: 24px;
}

.app-main::-webkit-scrollbar {
    width: 8px;
}

.app-main::-webkit-scrollbar-track {
    background: #F5F5F5;
    border-radius: 10px;
}

.app-main::-webkit-scrollbar-thumb {
    background: #BDBDBD;
    border-radius: 10px;
    transition: background 0.2s;
}

.app-main::-webkit-scrollbar-thumb:hover {
    background: #9E9E9E;
}

/* --- Hiệu ứng chuyển trang --- */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>