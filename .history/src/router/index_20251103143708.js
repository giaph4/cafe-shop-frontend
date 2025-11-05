// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { store } from '@/store'; // <-- Import store GỐC
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Dashboard from '@/views/Dashboard.vue';
import POS from '@/views/POS.vue';
import Orders from '@/views/Orders.vue';
import Products from '@/views/Products.vue';
import Categories from '@/views/Categories.vue';
import Inventory from '@/views/Inventory.vue';
import Suppliers from '@/views/Suppliers.vue';
import PurchaseOrders from '@/views/PurchaseOrders.vue';
import PurchaseOrderCreate from '@/views/PurchaseOrderCreate.vue';
import Customers from '@/views/Customers.vue';
import Users from '@/views/Users.vue';
import Expenses from '@/views/Expenses.vue';
import Reports from '@/views/Reports.vue';
import Tables from '@/views/Tables.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue'; // Giả sử bạn có view này

const routes = [
    {
        path: '/',
        component: DefaultLayout,
        children: [
            { path: '', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
            { path: 'pos', name: 'POS', component: POS, meta: { requiresAuth: true } },
            { path: 'orders', name: 'Orders', component: Orders, meta: { requiresAuth: true } },
            { path: 'products', name: 'Products', component: Products, meta: { requiresAuth: true } },
            { path: 'categories', name: 'Categories', component: Categories, meta: { requiresAuth: true } },
            { path: 'inventory', name: 'Inventory', component: Inventory, meta: { requiresAuth: true } },
            { path: 'suppliers', name: 'Suppliers', component: Suppliers, meta: { requiresAuth: true } },
            { path: 'purchase-orders', name: 'PurchaseOrders', component: PurchaseOrders, meta: { requiresAuth: true } },
            { path: 'purchase-orders/new', name: 'PurchaseOrderCreate', component: PurchaseOrderCreate, meta: { requiresAuth: true } },
            { path: 'customers', name: 'Customers', component: Customers, meta: { requiresAuth: true } },
            { path: 'users', name: 'Users', component: Users, meta: { requiresAuth: true, roles: ['ADMIN'] } },
            { path: 'expenses', name: 'Expenses', component: Expenses, meta: { requiresAuth: true } },
            { path: 'reports', name: 'Reports', component: Reports, meta: { requiresAuth: true } },
            { path: 'tables', name: 'Tables', component: Tables, meta: { requiresAuth: true } },
        ],
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

// Navigation Guard (Cập nhật để dùng store gốc)
router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    // Dùng store.getters['auth/getterName']
    const loggedIn = store.getters['auth/isLoggedIn'];
    const userRole = store.getters['auth/userRole'];

    if (requiresAuth && !loggedIn) {
        next('/login');
    } else if (requiresAuth && to.meta.roles && !to.meta.roles.includes(userRole)) {
        // Nếu yêu cầu role mà user không có
        next('/'); // Chuyển về dashboard
    } else {
        next();
    }
});

export default router;