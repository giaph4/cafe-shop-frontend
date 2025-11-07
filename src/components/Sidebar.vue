<template>
    <el-aside class="sidebar" width="250px">
        <div class="logo">
            <router-link to="/">
                <img src="https://scontent.fsgn2-4.fna.fbcdn.net/v/t39.30808-1/488254814_1121102093151861_7125486509227688983_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=101&ccb=1-7&_nc_sid=e99d92&_nc_eui2=AeHnPNmbK6-RM1CbxwWQo38paUWjPCRSEXFpRaM8JFIRcdM3FgWwO4e7PSxSAT-TceDLibeRE_C9kNJMBxyQj1nK&_nc_ohc=rFGH2zQ6cGgQ7kNvwGjQkMK&_nc_oc=AdkF2QV7mpYqGFVx6XfFO_ab56a-XunhRFBKBFwUUxZ5b6JKY3jBEbrB1Dg2sallJk0&_nc_zt=24&_nc_ht=scontent.fsgn2-4.fna&_nc_gid=pt-PlS4Z9gd_DH2FMDUCKw&oh=00_AfdhxqBTnDBjA250ZVv-RnshlD1bWxe_pC8hI6wYljUfGg&oe=690BFAAE"
                    alt="Logo" />
                <span>Coffee BestDN</span>
            </router-link>
        </div>

        <el-menu :default-active="activeMenu" class="sidebar-menu" background-color="var(--sidebar-bg)"
            text-color="var(--sidebar-text)" active-text-color="var(--sidebar-active-text)" router :collapse="false">
            <template v-for="route in menuRoutes" :key="route.path">
                <el-menu-item v-if="route.meta.title && hasPermission(route)" :index="'/' + route.path">
                    <component :is="icons[route.meta.icon]" class="menu-icon" />
                    <template #title>{{ route.meta.title }}</template>
                </el-menu-item>
            </template>
        </el-menu>
    </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import * as icons from '@/components/icons'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuRoutes = computed(() => {
    return router.options.routes.find(r => r.path === '/')?.children || []
})

const userRoles = computed(() => authStore.user?.roles || [])

const hasPermission = (route) => {
    if (route.meta && route.meta.roles) {
        return route.meta.roles.some(role => userRoles.value.includes(role))
    }
    return false
}

const activeMenu = computed(() => {
    return route.matched[1]?.path || route.path
})
</script>

<style scoped>
.sidebar {
    width: 260px;
    height: 100vh;
    background: #F8F6F3;
    border-right: 1px solid #E8E6E3;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.logo {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    border-bottom: 1px solid #F5F5F5;
}

.logo a {
    display: flex;
    align-items: center;
    text-decoration: none;
    gap: 12px;
}

.logo img {
    height: 40px;
    width: 40px;
    border-radius: 10px;
    object-fit: cover;
}

.logo span {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.sidebar-menu {
    flex: 1;
    border-right: none !important;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    background: #F8F6F3 !important;
}

.sidebar-menu::-webkit-scrollbar {
    width: 6px;
}

.sidebar-menu::-webkit-scrollbar-track {
    background: transparent;
}

.sidebar-menu::-webkit-scrollbar-thumb {
    background: #E0E0E0;
    border-radius: 10px;
}

.el-menu-item {
    font-weight: 500;
    border-radius: 12px !important;
    margin-bottom: 6px;
    color: #757575 !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-menu-item .menu-icon {
    width: 20px;
    height: 20px;
    margin-right: 12px;
}

.el-menu-item:hover {
    background: #EAE7E3 !important;
    color: #8B7355 !important;
    transform: translateX(4px);
}

.el-menu-item.is-active {
    background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%) !important;
    color: #FFFFFF !important;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
}

.el-menu-item.is-active .menu-icon {
    color: #FFFFFF;
}
</style>
