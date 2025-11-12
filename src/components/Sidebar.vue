<template>
    <el-aside class="sidebar" :class="{ collapsed: isCollapsed }" :width="sidebarWidth">
        <div class="sidebar-header">
            <router-link class="logo" to="/" :aria-label="t('sidebar.brand')">
                <img src="@/assets/logo.png"
                    alt="Logo" class="img-logo" />
                <transition name="fade">
                    <span v-if="!isCollapsed">{{ t('sidebar.brand') }}</span>
                </transition>
            </router-link>
        </div>

        <el-menu :default-active="activeMenu" :default-openeds="defaultOpenMenus" class="sidebar-menu" :class="{ collapsed: isCollapsed }"
            background-color="var(--sidebar-bg)" text-color="var(--sidebar-text)"
            active-text-color="var(--sidebar-active-text)" router :collapse="isCollapsed" :collapse-transition="false">
            <template v-for="route in menuRoutes" :key="route.path">
                <template v-if="isGroup(route) && getVisibleChildren(route).length">
                    <el-sub-menu :index="toMenuIndex(route.path)">
                        <template #title>
                            <el-icon v-if="getIcon(route)" class="menu-icon">
                                <component :is="getIcon(route)" />
                            </el-icon>
                            <span>{{ getTitle(route) }}</span>
                        </template>
                        <el-menu-item
                            v-for="child in getVisibleChildren(route)"
                            :key="child.path"
                            :index="resolveIndex(route, child)"
                        >
                            <el-icon v-if="getIcon(child)" class="menu-icon">
                                <component :is="getIcon(child)" />
                            </el-icon>
                            <template #title>{{ getTitle(child) }}</template>
                        </el-menu-item>
                    </el-sub-menu>
                </template>
                <el-menu-item
                    v-else-if="shouldDisplayRoute(route)"
                    :index="toMenuIndex(route.path)"
                >
                    <el-icon v-if="getIcon(route)" class="menu-icon">
                        <component :is="getIcon(route)" />
                    </el-icon>
                    <template #title>{{ getTitle(route) }}</template>
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
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarStore = useSidebarStore()
const { t } = useI18n()

const isCollapsed = computed(() => sidebarStore.isCollapsed)

const sidebarWidth = computed(() => isCollapsed.value ? '80px' : '260px')

const MENU_GROUPS = [
    {
        key: 'sales-group',
        titleKey: 'sidebar.sales',
        icon: 'ShoppingCart',
        routes: ['pos', 'orders', 'tables', 'customers']
    },
    {
        key: 'catalog-group',
        titleKey: 'sidebar.catalog',
        icon: 'Archive',
        routes: ['products', 'categories', 'inventory', 'suppliers', 'purchase-orders', 'expenses']
    },
    {
        key: 'operations-group',
        titleKey: 'sidebar.operations',
        icon: 'ClipboardList',
        routes: ['shift-management', 'payroll']
    },
    {
        key: 'analytics-group',
        titleKey: 'sidebar.analytics',
        icon: 'BarChart3',
        routes: ['reports', 'analytics/insight']
    },
    {
        key: 'team-group',
        titleKey: 'sidebar.team',
        icon: 'Users',
        routes: ['users']
    },
    {
        key: 'account-group',
        titleKey: 'sidebar.account',
        icon: 'UserCircle',
        routes: ['profile']
    }
]

const buildMenuRoutes = () => {
    const rootRoutes = router.options.routes.find(r => r.path === '/')?.children || []
    if (!rootRoutes.length) return []

    const visibleRoutes = rootRoutes.filter((route) => !route.meta?.hidden)
    const routeMap = visibleRoutes.reduce((map, route) => {
        map.set(route.path || '', route)
        return map
    }, new Map())

    const consumed = new Set()

    const groups = MENU_GROUPS.map((group) => {
        const children = group.routes
            .map((path) => routeMap.get(path))
            .filter(Boolean)

        children.forEach((child) => consumed.add(child.path || ''))

        return {
            path: group.key,
            meta: { titleKey: group.titleKey, icon: group.icon },
            children
        }
    }).filter((group) => group.children.length > 0)

    const ungrouped = visibleRoutes.filter((route) => !consumed.has(route.path || ''))

    return [...ungrouped, ...groups]
}

const menuRoutes = computed(() => buildMenuRoutes())

const GROUP_INDEX_PREFIX = 'group:'

const toMenuIndex = (path = '') => {
    if (!path) return '/'
    if (MENU_GROUPS.some((group) => group.key === path)) {
        return `${GROUP_INDEX_PREFIX}${path}`
    }
    return path.startsWith('/') ? path : `/${path}`
}

const userRoles = computed(() => authStore.roles || [])

const hasPermission = (route) => {
    if (route.meta?.hidden) {
        return false
    }
    if (route.meta && route.meta.roles) {
        return route.meta.roles.some(role => userRoles.value.includes(role))
    }
    return true
}

const activeMenu = computed(() => {
    const matchedPath = route.matched[1]?.path || route.path
    return matchedPath || '/'
})

const hasTitle = (route) => {
    return Boolean(route.meta?.titleKey || route.meta?.title)
}

const getTitle = (route) => {
    if (route.meta?.titleKey) {
        return t(route.meta.titleKey)
    }
    return route.meta?.title || ''
}

const hasIcon = (route) => {
    const iconKey = route.meta?.icon
    return Boolean(iconKey && icons[iconKey])
}

const getIcon = (route) => {
    if (!hasIcon(route)) return null
    return icons[route.meta.icon]
}

const isGroup = (route) => Array.isArray(route.children)

const getVisibleChildren = (route) => {
    if (!isGroup(route)) return []
    return route.children.filter((child) => shouldDisplayRoute(child))
}

const resolveIndex = (_parent, child) => {
    return toMenuIndex(child.path)
}

const shouldDisplayRoute = (route) => {
    if (!hasPermission(route)) return false
    if (!hasTitle(route)) return false
    if (!hasIcon(route)) return false
    return true
}

const defaultOpenMenus = computed(() => {
    const matchedPaths = route.matched
        .map((record) => (record.path || '').replace(/^\//, ''))
        .filter(Boolean)

    const group = MENU_GROUPS.find((group) =>
        group.routes.some((routePath) => matchedPaths.includes(routePath))
    )

    return group ? [toMenuIndex(group.key)] : []
})
</script>

<style scoped>
.sidebar {
    width: 260px;
    height: 100vh;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--sidebar-border-color);
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
    background: var(--sidebar-bg) !important;
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
    background: var(--scrollbar-thumb);
    border-radius: 10px;
}

.el-menu-item {
    font-weight: 500;
    border-radius: 12px !important;
    margin-bottom: 6px;
    color: var(--sidebar-text) !important;
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
