<template>
    <el-header class="navbar">
        <div class="page-title">
            {{ $route.meta.title || 'Dashboard' }}
        </div>

        <div class="user-menu">
            <el-dropdown @command="handleCommand">
                <span class="el-dropdown-link">
                    <UserCircle class="user-icon" />
                    <span class="user-name">{{ authStore.userFullName }}</span>
                    <ChevronDown class="arrow-icon" />
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="profile">
                            Thông tin cá nhân
                        </el-dropdown-item>
                        <el-dropdown-item command="logout" divided>
                            Đăng xuất
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </el-header>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router' // Import useRouter
import { UserCircle, ChevronDown } from '@/components/icons' // Import icon

const authStore = useAuthStore()
const router = useRouter() // Khởi tạo router

const handleCommand = (command) => {
    if (command === 'logout') {
        authStore.logout()
    } else if (command === 'profile') {
        router.push('/profile') // Chuyển hướng đến trang profile
    }
}
</script>

<style scoped>
.navbar {
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    padding: 0 20px;
}

.page-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #303133;
}

.user-menu {
    display: flex;
    align-items: center;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
    outline: none;
}

.user-icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
    color: #606266;
}

.user-name {
    font-weight: 500;
    margin-right: 5px;
}

.arrow-icon {
    width: 16px;
    height: 16px;
}
</style>