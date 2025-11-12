// src/router/index.js (ĐÃ SỬA LỖI)

import { createRouter, createWebHistory } from 'vue-router'
// Sửa lỗi: Thêm .js
import { useAuthStore } from '@/store/auth.js'

const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const Login = () => import('@/views/Login.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const AdminAnalytics = () => import('@/views/AdminAnalytics.vue')

const POS = () => import('@/views/POS.vue')
const Orders = () => import('@/views/Orders.vue')
const Products = () => import('@/views/Products.vue')
const Categories = () => import('@/views/Categories.vue')
const Tables = () => import('@/views/Tables.vue')
const Customers = () => import('@/views/Customers.vue')
const Inventory = () => import('@/views/Inventory.vue')
const Suppliers = () => import('@/views/Suppliers.vue')
const PurchaseOrders = () => import('@/views/PurchaseOrders.vue')
const PurchaseOrderCreate = () => import('@/views/PurchaseOrderCreate.vue')
const Expenses = () => import('@/views/Expenses.vue')
const Reports = () => import('@/views/Reports.vue')
const Users = () => import('@/views/Users.vue')
const ShiftSummary = () => import('@/views/ShiftSummary.vue')
const LoginHistory = () => import('@/views/LoginHistory.vue')

const ROLES = {
    ADMIN: 'ROLE_ADMIN',
    MANAGER: 'ROLE_MANAGER',
    STAFF: 'ROLE_STAFF'
}

const routes = [
    {
        path: '/',
        component: DefaultLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: 'Tổng quan', titleKey: 'routes.dashboard', icon: 'LayoutDashboard', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'pos',
                name: 'POS',
                component: POS,
                meta: { title: 'Bán hàng (POS)', titleKey: 'routes.pos', icon: 'Map', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'orders',
                name: 'Orders',
                component: Orders,
                meta: { title: 'Lịch sử Đơn hàng', titleKey: 'routes.orders', icon: 'ShoppingCart', roles: [ROLES.MANAGER, ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'tables',
                name: 'Tables',
                component: Tables,
                meta: { title: 'Quản lý Bàn', titleKey: 'routes.tables', icon: 'Armchair', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'customers',
                name: 'Customers',
                component: Customers,
                meta: { title: 'Khách hàng', titleKey: 'routes.customers', icon: 'Users', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'products',
                name: 'Products',
                component: Products,
                meta: { title: 'Sản phẩm', titleKey: 'routes.products', icon: 'Coffee', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'categories',
                name: 'Categories',
                component: Categories,
                meta: { title: 'Danh mục', titleKey: 'routes.categories', icon: 'ClipboardList', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'inventory',
                name: 'Inventory',
                component: Inventory,
                meta: { title: 'Tồn kho', titleKey: 'routes.inventory', icon: 'Archive', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'purchase-orders',
                name: 'PurchaseOrders',
                component: PurchaseOrders,
                meta: { title: 'Nhập hàng', titleKey: 'routes.purchaseOrders', icon: 'Truck', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'purchase-orders/create',
                name: 'PurchaseOrderCreate',
                component: PurchaseOrderCreate,
                meta: { roles: [ROLES.MANAGER, ROLES.ADMIN], titleKey: 'routes.purchaseOrderCreate' }
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: Suppliers,
                meta: { title: 'Nhà cung cấp', titleKey: 'routes.suppliers', icon: 'Contact', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'expenses',
                name: 'Expenses',
                component: Expenses,
                meta: { title: 'Chi phí', titleKey: 'routes.expenses', icon: 'Calculator', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'reports',
                name: 'Reports',
                component: Reports,
                meta: { title: 'Báo cáo', titleKey: 'routes.reports', icon: 'BarChart3', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'analytics/insight',
                name: 'AdminAnalytics',
                component: AdminAnalytics,
                meta: { title: 'AI Insight', titleKey: 'routes.adminAnalytics', icon: 'Notebook', roles: [ROLES.ADMIN] }
            },
            {
                path: 'users',
                name: 'Users',
                component: Users,
                meta: { title: 'Nhân viên', titleKey: 'routes.users', icon: 'UserCog', roles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'login-history',
                name: 'LoginHistory',
                component: LoginHistory,
                meta: { roles: [ROLES.ADMIN], hidden: true, titleKey: 'routes.loginHistory' }
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('@/views/Profile.vue'),
                meta: { roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], titleKey: 'routes.profile' }
            },
            {
                path: 'shift-summary',
                name: 'ShiftSummary',
                component: ShiftSummary,
                meta: {roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], hidden: true, titleKey: 'routes.shiftSummary' }
            }
        ]
    },
        {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { guest: true }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return { top: 0 }
    },
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const isGuest = to.matched.some(record => record.meta.guest)

    if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (isGuest && authStore.isAuthenticated) {
        next({ name: 'Dashboard' })
    } else if (requiresAuth && to.meta.roles) {
        const userRoles = authStore.user?.roles || []
        const hasPermission = to.meta.roles.some(role => userRoles.includes(role))

        if (hasPermission) {
            next()
        } else {
            next({ name: 'Dashboard' })
        }
    } else {
        next()
    }
})

export default router
