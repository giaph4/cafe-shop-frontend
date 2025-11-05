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
</style><template>
    <aside class="sidebar">
        <div class="logo-container">
            <img src="@/assets/logo.svg" alt="Logo" class="logo" />
            <h2 class_name="title">Cafe Coder</h2>
        </div>
        <nav class="navigation">
            <ul>
                <li><router-link to="/"><i class="icon">📊</i> Dashboard</router-link></li>
                <li><router-link to="/pos"><i class="icon">☕</i> POS</router-link></li>
                <li><router-link to="/orders"><i class="icon">🧾</i> Đơn hàng</router-link></li>
                <li><router-link to="/products"><i class="icon">🍰</i> Sản phẩm</router-link></li>
                <li><router-link to="/categories"><i class="icon">📚</i> Danh mục</router-link></li>
                <li><router-link to="/inventory"><i class="icon">📦</i> Kho hàng</router-link></li>
                <li><router-link to="/suppliers"><i class="icon">🚚</i> Nhà C.Cấp</router-link></li>
                <li><router-link to="/purchase-orders"><i class="icon">📝</i> Nhập hàng</router-link></li>
                <li><router-link to="/customers"><i class="icon">👥</i> Khách hàng</router-link></li>
                <li><router-link to="/expenses"><i class="icon">💸</i> Chi phí</router-link></li>
                <li><router-link to="/tables"><i class="icon">🪑</i> Quản lý Bàn</router-link></li>

                <template v-if="isAdmin">
                    <li class="admin-section">
                        <hr><span>Quản trị</span>
                    </li>
                    <li><router-link to="/users"><i class="icon">🧑‍💼</i> Nhân viên</router-link></li>
                    <li><router-link to="/reports"><i class="icon">📈</i> Báo cáo</router-link></li>
                </template>
            </ul>
        </nav>
        <div class="sidebar-footer">
            <button @click="handleLogout" class="logout-button">
                <i class="icon">🚪</i> Đăng xuất
            </button>
        </div>
    </aside>
</template>

<script setup>
  import { computed } from 'vue';
  import { useStore } from 'vuex'; // <-- Import useStore gốc
  
  const store = useStore(); // <-- Lấy store gốc
  
  // Lấy getter với namespace 'auth/userRole'
  const isAdmin = computed(() => store.getters['auth/userRole'] === 'ADMIN');
  
  const handleLogout = () => {
    // Gọi action với namespace 'auth/logout'
    store.dispatch('auth/logout');
  };
  </script>

<style scoped>
/* (Giữ nguyên style của bạn) */
.sidebar {
    width: 250px;
    background-color: #343a40;
    color: #c2c7d0;
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.logo-container {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #4f5962;
}

.logo {
    height: 40px;
    margin-right: 12px;
}

.title {
    color: #fff;
    font-size: 1.25rem;
    margin: 0;
}

.navigation {
    flex-grow: 1;
    overflow-y: auto;
}

.navigation ul {
    list-style: none;
    padding: 16px 0;
    margin: 0;
}

.navigation li a {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    color: #c2c7d0;
    text-decoration: none;
    transition: background-color 0.2s;
}

.navigation li a:hover {
    background-color: #495057;
    color: #fff;
}

.navigation li a .icon {
    margin-right: 12px;
    font-style: normal;
}

.router-link-active {
    background-color: #007bff;
    color: #fff !important;
}

.admin-section {
    padding: 10px 24px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #888;
}

.sidebar-footer {
    padding: 16px;
    border-top: 1px solid #4f5962;
}

.logout-button {
    width: 100%;
    padding: 10px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
</style>