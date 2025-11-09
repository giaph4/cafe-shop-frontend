<template>
    <el-aside class="sidebar" :class="{ collapsed: isCollapsed }" :width="sidebarWidth">
        <div class="sidebar-header">
            <router-link class="logo" to="/">
                <img src="@/assets/logo.png"
                    alt="Logo" class="img-logo" />
                <transition name="fade">
                    <span v-if="!isCollapsed">Coffee Siu</span>
                </transition>
            </router-link>
        </div>

        <el-menu :default-active="activeMenu" class="sidebar-menu" :class="{ collapsed: isCollapsed }"
            background-color="var(--sidebar-bg)" text-color="var(--sidebar-text)"
            active-text-color="var(--sidebar-active-text)" router :collapse="isCollapsed" :collapse-transition="false">
            <template v-for="route in menuRoutes" :key="route.path">
                <el-menu-item v-if="route.meta.title && hasPermission(route)" :index="'/' + route.path">
                    <el-icon class="menu-icon">
                        <component :is="icons[route.meta.icon]" />
                    </el-icon>
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
import { useSidebarStore } from '@/store/sidebar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarStore = useSidebarStore()

const isCollapsed = computed(() => sidebarStore.isCollapsed)

const sidebarWidth = computed(() => isCollapsed.value ? '80px' : '260px')

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
    transition: width 0.25s ease;
}

.sidebar.collapsed {
    width: 80px;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    height: 70px;
    border-bottom: 1px solid #F5F5F5;
    gap: 12px;
}

.sidebar.collapsed .sidebar-header {
    justify-content: center;
    padding: 16px 0;
}

.logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    gap: 12px;
    color: inherit;
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

.sidebar.collapsed .logo span {
    display: none;
}

.sidebar-menu {
    flex: 1;
    border-right: none !important;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    background: #F8F6F3 !important;
}

.sidebar-menu.collapsed {
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.sidebar.collapsed .el-menu-item {
    justify-content: center;
    align-items: center !important;
    display: flex !important;
    width: 56px;
    height: 56px;
    min-width: 56px;
    max-width: 56px;
    margin: 6px 0;
    padding: 0 !important;
    border-radius: 50% !important;
    background: rgba(139, 115, 85, 0.12) !important;
    box-shadow: 0 6px 14px rgba(139, 115, 85, 0.12);
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
    width: 22px;
    height: 22px;
    margin-right: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.sidebar.collapsed .el-menu-item .menu-icon {
    margin-right: 0;
    display: inline-flex;
}

.sidebar.collapsed .el-menu-item .el-menu-item__content {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.sidebar.collapsed .el-menu-item:hover,
.sidebar.collapsed .el-menu-item.is-active {
    transform: none;
}

.sidebar.collapsed .el-menu-item:hover {
    background: rgba(139, 115, 85, 0.2) !important;
    color: #6F5B45 !important;
}

.sidebar.collapsed .el-menu-item.is-active {
    background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%) !important;
    color: #FFFFFF !important;
    box-shadow: 0 10px 20px rgba(139, 115, 85, 0.25);
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
