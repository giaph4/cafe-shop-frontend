import { createRouter, createWebHistory } from 'vue-router';
import { store } from '@/store'; // Import store GỐC

// Layout
import DefaultLayout from '@/layouts/DefaultLayout.vue';

// Views
import Dashboard from '@/views/Dashboard.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import Products from '@/views/Products.vue';
import Categories from '@/views/Categories.vue';
import Tables from '@/views/Tables.vue';
import Customers from '@/views/Customers.vue';
import Inventory from '@/views/Inventory.vue';
import Suppliers from '@/views/Suppliers.vue';
import PurchaseOrders from '@/views/PurchaseOrders.vue';
import PurchaseOrderCreate from '@/views/PurchaseOrderCreate.vue';
import Users from '@/views/Users.vue';
import Expenses from '@/views/Expenses.vue';
import POS from '@/views/POS.vue';
import Orders from '@/views/Orders.vue';
import Reports from '@/views/Reports.vue';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: { requiresGuest: true },
    },
    {
        path: '/',
        component: DefaultLayout,
        meta: { requiresAuth: true }, // Tất cả trang bên trong cần đăng nhập
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: Dashboard,
            },
            {
                path: '/pos',
                name: 'POS',
                component: POS,
            },
            {
                path: '/orders',
                name: 'Orders',
                component: Orders,
            },
            {
                path: '/products',
                name: 'Products',
                component: Products,
            },
            {
                path: '/categories',
                name: 'Categories',
                component: Categories,
            },
            {
                path: '/tables',
                name: 'Tables',
                component: Tables,
            },
            {
                path: '/customers',
                name: 'Customers',
                component: Customers,
            },
            {
                path: '/inventory',
                name: 'Inventory',
                component: Inventory,
            },
            {
                path: '/suppliers',
                name: 'Suppliers',
                component: Suppliers,
            },
            {
                path: '/purchase-orders',
                name: 'PurchaseOrders',
                component: PurchaseOrders,
            },
            {
                path: '/purchase-orders/create',
                name: 'PurchaseOrderCreate',
                component: PurchaseOrderCreate,
            },
            {
                path: '/users',
                name: 'Users',
                component: Users,
            },
            {
                path: '/expenses',
                name: 'Expenses',
                component: Expenses,
            },
            {
                path: '/reports',
                name: 'Reports',
                component: Reports,
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

// Bộ gác cổng (Navigation Guard)
router.beforeEach((to, from, next) => {
    // Kiểm tra xem trang có yêu cầu đăng nhập không
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        // Sử dụng getter từ store GỐC
        if (!store.getters['auth/isLoggedIn']) {
            next({ name: 'Login' });
        } else {
            next(); // Đã đăng nhập, cho đi
        }
    }
    // Kiểm tra trang "khách" (như Login, Register)
    else if (to.matched.some((record) => record.meta.requiresGuest)) {
        if (store.getters['auth/isLoggedIn']) {
            next({ name: 'Dashboard' }); // Đã đăng nhập, đá về Dashboard
        } else {
            next(); // Chưa đăng nhập, cho đi
        }
    }
    // Các trang không yêu cầu gì
    else {
        next();
    }
});

export default router;