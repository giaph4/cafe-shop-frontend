// src/router/index.js (ĐÃ SỬA LỖI)

import { createRouter, createWebHistory } from 'vue-router'
// Sửa lỗi: Thêm .js
import { useAuthStore } from '@/store/auth.js'

import DefaultLayout from '@/layouts/DefaultLayout.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'

// Import các trang
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
// const Register = () => import('@/views/Register.vue') // SỬA LỖI: XÓA ROUTE NÀY

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
            // ... (Các route khác giữ nguyên) ...
            {
                path: '',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: 'Tổng quan', icon: 'LayoutDashboard', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'pos',
                name: 'POS',
                component: POS,
                meta: { title: 'Bán hàng (POS)', icon: 'Map', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'orders',
                name: 'Orders',
                component: Orders,
                meta: { title: 'Lịch sử Đơn hàng', icon: 'ShoppingCart', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'tables',
                name: 'Tables',
                component: Tables,
                meta: { title: 'Quản lý Bàn', icon: 'Armchair', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'customers',
                name: 'Customers',
                component: Customers,
                meta: { title: 'Khách hàng', icon: 'Users', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'products',
                name: 'Products',
                component: Products,
                meta: { title: 'Sản phẩm', icon: 'Coffee', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'categories',
                name: 'Categories',
                component: Categories,
                meta: { title: 'Danh mục', icon: 'ClipboardList', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'inventory',
                name: 'Inventory',
                component: Inventory,
                meta: { title: 'Tồn kho', icon: 'Archive', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'purchase-orders',
                name: 'PurchaseOrders',
                component: PurchaseOrders,
                meta: { title: 'Nhập hàng', icon: 'Truck', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'purchase-orders/create',
                name: 'PurchaseOrderCreate',
                component: PurchaseOrderCreate,
                meta: { title: 'Tạo Phiếu nhập', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: Suppliers,
                meta: { title: 'Nhà cung cấp', icon: 'Contact', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'expenses',
                name: 'Expenses',
                component: Expenses,
                meta: { title: 'Chi phí', icon: 'Calculator', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'reports',
                name: 'Reports',
                component: Reports,
                meta: { title: 'Báo cáo', icon: 'BarChart3', roles: [ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'users',
                name: 'Users',
                component: Users,
                // SỬA LỖI: Cho phép Manager vào trang Nhân viên
                meta: { title: 'Nhân viên', icon: 'UserCog', roles: [ROLES.ADMIN, ROLES.MANAGER] }
            }
        ]
    },
    // --- Trang Public ---
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

// --- Navigation Guard (Giữ nguyên) ---
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