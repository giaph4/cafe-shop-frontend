import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

// Import Layouts
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// Import Views
import Dashboard from '@/views/Dashboard.vue'
import Login from '@/views/Login.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout, // Layout chính (có sidebar, navbar)
    meta: { requiresAuth: true }, // Yêu cầu đăng nhập
    children: [
      {
        path: '', // Trang chủ (Dashboard)
        name: 'Dashboard',
        component: Dashboard,
      },
      // (Chúng ta sẽ thêm các route khác như Products, Orders ở đây)
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true } // Chỉ cho phép truy cập nếu chưa đăng nhập
  }
  // (Chúng ta sẽ thêm trang Register sau)
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// --- Navigation Guard (Bảo vệ Route) ---
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Nếu route yêu cầu đăng nhập VÀ user chưa đăng nhập
    next('/login') // Chuyển hướng đến trang Login
  } else if (to.meta.guest && authStore.isAuthenticated) {
    // Nếu route là 'guest' (như Login) VÀ user đã đăng nhập
    next('/') // Chuyển hướng đến Dashboard
  } else {
    // Các trường hợp khác
    next() // Cho phép đi tiếp
  }
})

export default router