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
    // Sửa: Nếu route không yêu cầu role (meta.roles không có) thì MỌI NGƯỜI đều xem được
    // (Trừ khi logic của bạn là "không role" = "không ai xem được", nhưng thường là ngược lại)
    // Nếu bạn muốn chỉ admin/employee xem được, bạn phải định nghĩa meta.roles trong router
    if (!route.meta || !route.meta.roles) {
        return true; // Cho phép nếu không định nghĩa roles
    }
    return false
}

const activeMenu = computed(() => {
    return route.matched[1]?.path || route.path
})
</script>

<style scoped>
.sidebar {
    background-color: var(--sidebar-bg);
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
}

.logo a {
    display: flex;
    align-items: center;
    text-decoration: none;
}

.logo img {
    height: 32px;
    width: 32px;
    margin-right: 12px;
}

.logo span {
    font-size: 1.2rem;
    font-weight: 600;
    color: #fff;
}

.sidebar-menu {
    flex: 1;
    border-right: none !important;
    overflow-y: auto;
    overflow-x: hidden;
}

.el-menu-item {
    font-weight: 500;
}

.el-menu-item .menu-icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
}

.el-menu-item:hover {
    background-color: #263445 !important;
}

.el-menu-item.is-active {
    background-color: #263445 !important;
    font-weight: 600;
}
</style>

|  import { useAuthStore } from '@/store/auth'
|                                  ^