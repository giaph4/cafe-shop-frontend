import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

import DefaultLayout from '@/layouts/DefaultLayout.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'

// Import các trang (lazy-loading)
const Products = () => import('@/views/Products.vue')
const Categories = () => import('@/views/Categories.vue')
const Tables = () => import('@/views/Tables.vue')
const Orders = () => import('@/views/Orders.vue')
const Customers = () => import('@/views/Customers.vue')
const Inventory = () => import('@/views/Inventory.vue')
const Suppliers = () => import('@/views/Suppliers.vue')
const PurchaseOrders = () => import('@/views/PurchaseOrders.vue')
const Expenses = () => import('@/views/Expenses.vue')
const Reports = () => import('@/views/Reports.vue')
const Users = () => import('@/views/Users.vue')
const Register = () => import('@/views/Register.vue')

// Định nghĩa vai trò (để dễ quản lý)
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
            // --- Chung (STAFF trở lên) ---
            {
                path: '',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: 'Tổng quan', icon: 'LayoutDashboard', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'orders',
                name: 'Orders',
                component: Orders,
                meta: { title: 'Quản lý Đơn hàng', icon: 'ShoppingCart', roles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
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
            // --- Quản lý (MANAGER trở lên) ---
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
            // --- Admin ---
            {
                path: 'users',
                name: 'Users',
                component: Users,
                meta: { title: 'Nhân viên', icon: 'UserCog', roles: [ROLES.ADMIN] }
            },
        ]
    },
    // --- Trang Public ---
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { guest: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: { guest: true } // Hoặc { requiresAuth: true, roles: [ROLES.ADMIN] } nếu chỉ Admin được tạo
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return { top: 0 }
    },
})

// --- Navigation Guard (Đã cập nhật logic phân quyền) ---
router.beforeEach((to, from, next) => {
    // Khởi tạo store *bên trong* guard
    const authStore = useAuthStore()

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const isGuest = to.matched.some(record => record.meta.guest)

    if (requiresAuth && !authStore.isAuthenticated) {
        // 1. Yêu cầu đăng nhập nhưng chưa đăng nhập
        next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (isGuest && authStore.isAuthenticated) {
        // 2. Trang guest (Login) nhưng đã đăng nhập
        next({ name: 'Dashboard' })
    } else if (requiresAuth && to.meta.roles) {
        // 3. Yêu cầu đăng nhập VÀ yêu cầu quyền (roles)
        const userRoles = authStore.user?.roles || []
        const hasPermission = to.meta.roles.some(role => userRoles.includes(role))

        if (hasPermission) {
            next() // Có quyền, cho đi tiếp
        } else {
            // Không có quyền, đá về Dashboard
            if (from.name === 'Dashboard' && to.name === 'Dashboard') {
                // Trường hợp đặc biệt: Bị lặp vô hạn (rất hiếm sau khi sửa lỗi)
                console.error("Infinite redirect detected manually.");
                next(false); // Dừng lại
            } else {
                next({ name: 'Dashboard' }); // Gửi về trang an toàn
            }
        }
    } else {
        // 4. Các trường hợp còn lại
        next()
    }
})

export default router